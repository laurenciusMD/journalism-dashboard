#!/bin/bash
#
# Database Migration Runner
# Applies pending migrations safely
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================================="
echo "📋 Database Migration System"
echo "=================================================="
echo ""

# Migration directory
MIGRATIONS_DIR="backend/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "❌ Migrations directory not found: $MIGRATIONS_DIR"
  exit 1
fi

# Check if postgres is running
if ! docker compose ps postgres | grep -q "Up"; then
  echo "❌ PostgreSQL container is not running"
  echo "   Start it with: docker compose up -d postgres"
  exit 1
fi

# Create migrations tracking table if it doesn't exist
echo "🔧 Setting up migration tracking..."
docker compose exec -T postgres psql -U journalism journalism << 'EOF'
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW()
);
EOF
echo "   ✓ Migration tracking ready"
echo ""

# Get list of applied migrations
APPLIED_MIGRATIONS=$(docker compose exec -T postgres psql -U journalism journalism -t -c "SELECT migration_name FROM schema_migrations ORDER BY migration_name;" | tr -d ' ' | grep -v '^$' || echo "")

# Get list of all migrations
ALL_MIGRATIONS=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | xargs -n1 basename | sort || echo "")

if [ -z "$ALL_MIGRATIONS" ]; then
  echo "ℹ️  No migration files found in $MIGRATIONS_DIR"
  exit 0
fi

# Find pending migrations
PENDING_MIGRATIONS=()
for migration in $ALL_MIGRATIONS; do
  if ! echo "$APPLIED_MIGRATIONS" | grep -q "^$migration$"; then
    PENDING_MIGRATIONS+=("$migration")
  fi
done

# Show status
APPLIED_COUNT=$(echo "$APPLIED_MIGRATIONS" | grep -c "sql" || echo "0")
PENDING_COUNT=${#PENDING_MIGRATIONS[@]}

echo "📊 Migration Status:"
echo "   Applied: $APPLIED_COUNT"
echo "   Pending: $PENDING_COUNT"
echo ""

if [ $PENDING_COUNT -eq 0 ]; then
  echo "✅ Database is up to date!"
  echo ""
  echo "Applied migrations:"
  echo "$APPLIED_MIGRATIONS" | sed 's/^/   - /'
  exit 0
fi

# Show pending migrations
echo "⏳ Pending migrations:"
for migration in "${PENDING_MIGRATIONS[@]}"; do
  echo "   - $migration"
done
echo ""

# Ask for confirmation
read -p "Apply these migrations now? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

# Apply pending migrations
echo "🚀 Applying migrations..."
echo ""

SUCCESS_COUNT=0
for migration in "${PENDING_MIGRATIONS[@]}"; do
  echo "📋 Applying: $migration"

  # Apply migration
  if docker compose exec -T postgres psql -U journalism journalism -f "/docker-entrypoint-initdb.d/$migration"; then
    # Record as applied
    docker compose exec -T postgres psql -U journalism journalism -c "INSERT INTO schema_migrations (migration_name) VALUES ('$migration');" >/dev/null

    echo "   ✅ $migration applied successfully"
    ((SUCCESS_COUNT++))
  else
    echo "   ❌ $migration FAILED!"
    echo ""
    echo "⚠️  Migration failed at: $migration"
    echo ""
    echo "Applied: $SUCCESS_COUNT/$PENDING_COUNT"
    echo ""
    echo "Manual intervention required!"
    echo "   1. Check the error message above"
    echo "   2. Fix the migration file or database state"
    echo "   3. Run ./migrate.sh again"
    exit 1
  fi
  echo ""
done

echo "=================================================="
echo "✅ All migrations applied successfully!"
echo "=================================================="
echo ""
echo "   Applied: $SUCCESS_COUNT/$PENDING_COUNT"
echo ""
echo "Database is now up to date."
echo "=================================================="
