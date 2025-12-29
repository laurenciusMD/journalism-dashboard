#!/bin/bash
set -e

echo "=========================================="
echo "📰 Journalism Dashboard Startup"
echo "=========================================="

# PostgreSQL data directory
PGDATA="/var/lib/postgresql/data"
POSTGRES_USER="journalism"
POSTGRES_DB="journalism"
POSTGRES_PASSWORD="${JOURNALISM_DB_PASSWORD:-journalism}"

# Check if PostgreSQL is initialized
if [ ! -f "$PGDATA/PG_VERSION" ]; then
    echo "🔧 Initializing PostgreSQL database..."

    # Initialize PostgreSQL as postgres user
    su - postgres -c "/usr/lib/postgresql/15/bin/initdb -D $PGDATA"

    # Configure PostgreSQL to allow local connections
    echo "host all all 127.0.0.1/32 md5" >> $PGDATA/pg_hba.conf
    echo "host all all ::1/128 md5" >> $PGDATA/pg_hba.conf
    echo "local all all trust" >> $PGDATA/pg_hba.conf

    # Start PostgreSQL temporarily to create database and user
    echo "🚀 Starting PostgreSQL temporarily..."
    su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D $PGDATA -l /tmp/postgres-init.log start"

    # Wait for PostgreSQL to be ready
    sleep 5

    # Create database and user
    echo "👤 Creating database and user..."
    su - postgres -c "psql -c \"CREATE USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD';\""
    su - postgres -c "psql -c \"CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;\""
    su - postgres -c "psql -d $POSTGRES_DB -c \"CREATE EXTENSION IF NOT EXISTS \\\"uuid-ossp\\\";\""
    su - postgres -c "psql -d $POSTGRES_DB -c \"CREATE EXTENSION IF NOT EXISTS pg_trgm;\""

    # Run migrations
    if [ -f "/app/migrations/001_initial_schema.sql" ]; then
        echo "📋 Running database migrations..."
        su - postgres -c "psql -d $POSTGRES_DB -f /app/migrations/001_initial_schema.sql"
    fi

    # Stop temporary PostgreSQL
    echo "⏸️  Stopping temporary PostgreSQL..."
    su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D $PGDATA stop"

    sleep 2

    echo "✅ PostgreSQL initialization complete!"
else
    echo "✅ PostgreSQL already initialized"
fi

# Set environment variables
export NODE_ENV=production
export POSTGRES_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB"
export REDIS_URL="redis://localhost:6379"

echo ""
echo "🚀 Starting all services with supervisord..."
echo "   - PostgreSQL 15"
echo "   - Redis 7"
echo "   - Journalism Dashboard"
echo ""

# Start supervisord (this will start PostgreSQL, Redis, and the app)
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
