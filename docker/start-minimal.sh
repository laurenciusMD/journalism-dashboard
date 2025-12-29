#!/bin/bash
set -e

echo "=========================================="
echo "📰 Journalism Dashboard + Nextcloud Startup"
echo "=========================================="

# ===== PostgreSQL Setup =====
PGDATA="/var/lib/postgresql/data"
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
    fi

    echo "👤 Creating Nextcloud database and user..."
    su - postgres -c "psql -c \"CREATE USER $NEXTCLOUD_DB_USER WITH PASSWORD '$NEXTCLOUD_DB_PASSWORD';\""
    su - postgres -c "psql -c \"CREATE DATABASE $NEXTCLOUD_DB OWNER $NEXTCLOUD_DB_USER;\""

    su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D $PGDATA stop"
    sleep 2
    echo "✅ PostgreSQL initialization complete!"
else
    echo "✅ PostgreSQL already initialized"
fi

# ===== Nextcloud Setup =====
NEXTCLOUD_DATA="/var/www/nextcloud/data"
NEXTCLOUD_ADMIN="${NEXTCLOUD_ADMIN_USER:-admin}"
NEXTCLOUD_ADMIN_PASSWORD="${NEXTCLOUD_ADMIN_PASSWORD:-admin123}"

# Configure Apache to listen on port 8080
sed -i 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf

# Start PostgreSQL for Nextcloud installation
echo "🚀 Starting PostgreSQL for Nextcloud setup..."
su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D $PGDATA -l /tmp/postgres-nextcloud.log start"
sleep 5

if [ ! -f "/var/www/nextcloud/config/config.php" ]; then
    echo "🔧 Installing Nextcloud with PostgreSQL..."

    cd /var/www/nextcloud
    sudo -u www-data php occ maintenance:install \
        --database="pgsql" \
        --database-host="localhost" \
        --database-name="$NEXTCLOUD_DB" \
        --database-user="$NEXTCLOUD_DB_USER" \
        --database-pass="$NEXTCLOUD_DB_PASSWORD" \
        --admin-user="$NEXTCLOUD_ADMIN" \
        --admin-pass="$NEXTCLOUD_ADMIN_PASSWORD" \
        --data-dir="$NEXTCLOUD_DATA"

    # Configure trusted domains
    sudo -u www-data php occ config:system:set trusted_domains 0 --value="localhost"
    sudo -u www-data php occ config:system:set trusted_domains 1 --value="127.0.0.1"
    sudo -u www-data php occ config:system:set trusted_domains 2 --value="*"

    # Set overwrite protocol
    sudo -u www-data php occ config:system:set overwriteprotocol --value="http"

    # Configure cron
    sudo -u www-data php occ background:cron

    echo "✅ Nextcloud installation complete!"
    echo "   Admin user: $NEXTCLOUD_ADMIN"
    echo "   Admin password: $NEXTCLOUD_ADMIN_PASSWORD"
    echo "   Database: PostgreSQL"
else
    echo "✅ Nextcloud already configured"
fi

# Stop temporary PostgreSQL (supervisord will restart it)
su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D $PGDATA stop"
sleep 2

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
