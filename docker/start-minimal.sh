#!/bin/bash
set -e

# Read version from VERSION file or package.json
VERSION="0.8.0"
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
# Initial admin account (only used during first setup)
# After setup, all user management happens in Nextcloud
NEXTCLOUD_ADMIN="${NEXTCLOUD_INITIAL_ADMIN_USER:-admin}"
NEXTCLOUD_ADMIN_PASSWORD="${NEXTCLOUD_INITIAL_ADMIN_PASSWORD:-admin123}"

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
# This protects existing Nextcloud installations from being overwritten
if [ "$NEXTCLOUD_HAS_DATA" = false ] && [ "$NEXTCLOUD_INSTALLED" = false ]; then
    echo "🔧 Installing fresh Nextcloud with PostgreSQL..."
    echo "   Using credentials: $NEXTCLOUD_ADMIN (from NEXTCLOUD_INITIAL_ADMIN_* env vars)"

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
    echo "🔧 Nextcloud data exists but config missing - auto-repairing..."

    # Get existing instanceid if it exists, otherwise generate new one
    INSTANCE_ID="oc$(openssl rand -hex 6)"
    if [ -f "/var/www/nextcloud/config/config.php" ]; then
        EXISTING_ID=$(grep -oP "(?<='instanceid' => ')[^']*" /var/www/nextcloud/config/config.php 2>/dev/null || echo "")
        if [ ! -z "$EXISTING_ID" ]; then
            INSTANCE_ID="$EXISTING_ID"
            echo "   Using existing instanceid: $INSTANCE_ID"
        fi
    fi

    # Create proper config.php
    cat > /var/www/nextcloud/config/config.php <<EOF
<?php
\$CONFIG = array (
  'instanceid' => '$INSTANCE_ID',
  'passwordsalt' => '$(openssl rand -hex 16)',
  'secret' => '$(openssl rand -hex 32)',
  'trusted_domains' =>
  array (
    0 => 'localhost',
    1 => '127.0.0.1',
    2 => '*',
  ),
  'datadirectory' => '$NEXTCLOUD_DATA',
  'dbtype' => 'pgsql',
  'version' => '28.0.2.5',
  'overwrite.cli.url' => 'http://localhost:8080',
  'overwriteprotocol' => 'http',
  'dbname' => '$NEXTCLOUD_DB',
  'dbhost' => 'localhost',
  'dbport' => '',
  'dbtableprefix' => 'oc_',
  'dbuser' => '$NEXTCLOUD_DB_USER',
  'dbpassword' => '$NEXTCLOUD_DB_PASSWORD',
  'installed' => true,
);
EOF

    # Set correct permissions
    chown www-data:www-data /var/www/nextcloud/config/config.php
    chmod 640 /var/www/nextcloud/config/config.php

    echo "✅ Nextcloud config auto-repaired!"
    echo "   Your existing data and database are preserved"
else
    echo "✅ Using existing Nextcloud installation"
    echo "   ⚠️  NEXTCLOUD_INITIAL_ADMIN_* env vars are IGNORED (installation already exists)"
    echo "   💡 User management: Use Nextcloud UI or 'occ' commands"
fi

# ===== Nextcloud Post-Installation Configuration =====
if [ "$NEXTCLOUD_INSTALLED" = true ] || [ "$NEXTCLOUD_HAS_DATA" = true ]; then
    echo "🔧 Configuring Nextcloud optimizations..."
    cd /var/www/nextcloud

    # Add missing database indices (improves performance)
    su -s /bin/bash www-data -c "php occ db:add-missing-indices" 2>/dev/null || echo "   DB indices already added or skipped"

    # Set default phone region (Germany - adjust as needed)
    su -s /bin/bash www-data -c "php occ config:system:set default_phone_region --value='DE'" 2>/dev/null || true

    # Set maintenance window (2 AM - low traffic time)
    su -s /bin/bash www-data -c "php occ config:system:set maintenance_window_start --type=integer --value=2" 2>/dev/null || true

    # Create 'journalists' group if it doesn't exist
    if ! su -s /bin/bash www-data -c "php occ group:list" | grep -q "journalists"; then
        echo "👥 Creating 'journalists' user group..."
        su -s /bin/bash www-data -c "php occ group:add journalists" 2>/dev/null || true
        echo "   ✅ Journalists group created - use this for non-admin users"
    fi

    echo "✅ Nextcloud configuration optimized!"
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
