#!/bin/bash
set -e

# Read version from VERSION file or package.json
VERSION="0.7.0"
if [ -f "/app/VERSION" ]; then
    VERSION=$(cat /app/VERSION)
fi

echo "=========================================="
echo "🔍 Quill v${VERSION}"
echo "   Journalism Research Platform"
echo "   + Nextcloud Integration"
echo "   © 2024-2025 Laurencius"
echo "=========================================="

# ===== PostgreSQL Setup =====
PGDATA="/var/lib/postgresql/data"

# Ensure PostgreSQL directories have correct permissions
chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql 2>/dev/null || true
chmod 2777 /var/run/postgresql 2>/dev/null || true
POSTGRES_USER="journalism"
POSTGRES_DB="journalism"
POSTGRES_PASSWORD="${JOURNALISM_DB_PASSWORD:-journalism}"

# Nextcloud database configuration (same PostgreSQL instance)
NEXTCLOUD_DB="nextcloud"
NEXTCLOUD_DB_USER="nextcloud"
NEXTCLOUD_DB_PASSWORD="${NEXTCLOUD_DB_PASSWORD:-nextcloud_password}"

if [ ! -f "$PGDATA/PG_VERSION" ]; then
    echo "🔧 Initializing PostgreSQL database..."
    su - postgres -c "/usr/lib/postgresql/15/bin/initdb -D $PGDATA"

    echo "host all all 127.0.0.1/32 md5" >> $PGDATA/pg_hba.conf
    echo "host all all ::1/128 md5" >> $PGDATA/pg_hba.conf
    echo "local all all trust" >> $PGDATA/pg_hba.conf

    echo "🚀 Starting PostgreSQL temporarily..."
    su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D $PGDATA -l /tmp/postgres-init.log start"
    sleep 5

    echo "👤 Creating journalism database and user..."
    su - postgres -c "psql -c \"CREATE USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD';\""
    su - postgres -c "psql -c \"CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;\""
    su - postgres -c "psql -d $POSTGRES_DB -c \"CREATE EXTENSION IF NOT EXISTS \\\"uuid-ossp\\\";\""
    su - postgres -c "psql -d $POSTGRES_DB -c \"CREATE EXTENSION IF NOT EXISTS pg_trgm;\""

    if [ -f "/app/migrations/001_initial_schema.sql" ]; then
        echo "📋 Running journalism database migrations..."
        su - postgres -c "psql -d $POSTGRES_DB -f /app/migrations/001_initial_schema.sql"

        echo "🔐 Granting permissions to journalism user..."
        su - postgres -c "psql -d $POSTGRES_DB -c 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;'"
        su - postgres -c "psql -d $POSTGRES_DB -c 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $POSTGRES_USER;'"
        su - postgres -c "psql -d $POSTGRES_DB -c 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $POSTGRES_USER;'"
        su - postgres -c "psql -d $POSTGRES_DB -c 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $POSTGRES_USER;'"
    fi

    echo "👤 Creating Nextcloud database and user..."
    su - postgres -c "psql -c \"CREATE USER $NEXTCLOUD_DB_USER WITH PASSWORD '$NEXTCLOUD_DB_PASSWORD';\""
    su - postgres -c "psql -c \"CREATE DATABASE $NEXTCLOUD_DB OWNER $NEXTCLOUD_DB_USER;\""

    echo "⏸️  Stopping temporary PostgreSQL after initialization..."
    su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D $PGDATA stop" || true
    sleep 3
    echo "✅ PostgreSQL initialization complete!"
else
    echo "✅ PostgreSQL already initialized"
fi

# ===== Nextcloud Setup =====
NEXTCLOUD_DATA="/var/www/nextcloud/data"
NEXTCLOUD_ADMIN="${NEXTCLOUD_ADMIN_USER:-admin}"
NEXTCLOUD_ADMIN_PASSWORD="${NEXTCLOUD_ADMIN_PASSWORD:-admin123}"

# Note: Apache port 8080 is already configured in the Dockerfile

# Start PostgreSQL for Nextcloud installation if not running
echo "🚀 Starting PostgreSQL for Nextcloud setup..."
if ! su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D $PGDATA status" > /dev/null 2>&1; then
    su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D $PGDATA -l /tmp/postgres-nextcloud.log start"
    sleep 5
else
    echo "✅ PostgreSQL already running"
fi

# Check if Nextcloud data directory has existing data
NEXTCLOUD_HAS_DATA=false
if [ -d "$NEXTCLOUD_DATA" ] && [ "$(ls -A $NEXTCLOUD_DATA 2>/dev/null)" ]; then
    NEXTCLOUD_HAS_DATA=true
    echo "📦 Nextcloud data directory contains existing data"
fi

# Check if Nextcloud is properly installed
NEXTCLOUD_INSTALLED=false
if [ -f "/var/www/nextcloud/config/config.php" ]; then
    if grep -q "'installed' => true" /var/www/nextcloud/config/config.php; then
        NEXTCLOUD_INSTALLED=true
        echo "✅ Nextcloud already configured and installed"
    fi
fi

# Only install if no data exists AND not installed
if [ "$NEXTCLOUD_HAS_DATA" = false ] && [ "$NEXTCLOUD_INSTALLED" = false ]; then
    echo "🔧 Installing fresh Nextcloud with PostgreSQL..."

    # Remove any incomplete config
    rm -f /var/www/nextcloud/config/config.php
    rm -f /var/www/nextcloud/config/CAN_INSTALL

    cd /var/www/nextcloud
    su -s /bin/bash www-data -c "php occ maintenance:install \
        --database=\"pgsql\" \
        --database-host=\"localhost\" \
        --database-name=\"$NEXTCLOUD_DB\" \
        --database-user=\"$NEXTCLOUD_DB_USER\" \
        --database-pass=\"$NEXTCLOUD_DB_PASSWORD\" \
        --admin-user=\"$NEXTCLOUD_ADMIN\" \
        --admin-pass=\"$NEXTCLOUD_ADMIN_PASSWORD\" \
        --data-dir=\"$NEXTCLOUD_DATA\""

    # Configure trusted domains
    su -s /bin/bash www-data -c "php occ config:system:set trusted_domains 0 --value=\"localhost\""
    su -s /bin/bash www-data -c "php occ config:system:set trusted_domains 1 --value=\"127.0.0.1\""
    su -s /bin/bash www-data -c "php occ config:system:set trusted_domains 2 --value=\"*\""

    # Set overwrite protocol
    su -s /bin/bash www-data -c "php occ config:system:set overwriteprotocol --value=\"http\""

    # Configure cron
    su -s /bin/bash www-data -c "php occ background:cron"

    # Ensure CAN_INSTALL is removed
    rm -f /var/www/nextcloud/config/CAN_INSTALL

    echo "✅ Nextcloud installation complete!"
    echo "   Admin user: $NEXTCLOUD_ADMIN"
    echo "   Admin password: $NEXTCLOUD_ADMIN_PASSWORD"
    echo "   Database: PostgreSQL"
elif [ "$NEXTCLOUD_HAS_DATA" = true ] && [ "$NEXTCLOUD_INSTALLED" = false ]; then
    echo "⚠️  Nextcloud data exists but not properly configured"
    echo "   Skipping installation to preserve existing data"
    echo "   Please check Nextcloud manually at http://localhost:8080"
else
    echo "✅ Using existing Nextcloud installation"
fi

# Stop temporary PostgreSQL (supervisord will restart it)
echo "⏸️  Stopping temporary PostgreSQL..."
su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D $PGDATA stop" || true
sleep 3

# Set environment variables
export NODE_ENV=production
export POSTGRES_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB"
export REDIS_URL="redis://localhost:6379"
export NEXTCLOUD_URL="http://localhost:8080"

echo ""
echo "🚀 Starting all services with supervisord..."
echo "   - PostgreSQL 15 (Journalism + Nextcloud DBs)"
echo "   - Redis 7"
echo "   - Apache (Nextcloud on :8080)"
echo "   - Journalism Dashboard (:3001)"
echo ""
echo "📰 Journalism Dashboard: http://localhost:3001"
echo "☁️  Nextcloud: http://localhost:8080"
echo ""
echo "💡 Effizienz: Eine PostgreSQL-Instanz für beide Datenbanken!"
echo ""

# Start supervisord (this will start all services)
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
