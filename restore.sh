#!/bin/bash
#
# Journalism Dashboard - Restore Script
# Restores complete backup of all data
#
# Usage: ./restore.sh <backup-name>
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_NAME="$1"

if [ -z "$BACKUP_NAME" ]; then
  echo "❌ Error: No backup name provided"
  echo ""
  echo "Usage: ./restore.sh <backup-name>"
  echo ""
  echo "Available backups:"
  ls -1 "$BACKUP_DIR" 2>/dev/null || echo "  (none found)"
  exit 1
fi

BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

if [ ! -d "$BACKUP_PATH" ]; then
  echo "❌ Error: Backup not found: $BACKUP_PATH"
  echo ""
  echo "Available backups:"
  ls -1 "$BACKUP_DIR" 2>/dev/null || echo "  (none found)"
  exit 1
fi

echo "=================================================="
echo "🔄 Journalism Dashboard - Restore Backup"
echo "=================================================="
echo "Backup: $BACKUP_NAME"
echo "Path: $BACKUP_PATH"
echo ""

# Safety check
echo "⚠️  WARNING: This will REPLACE all current data!"
echo ""
read -p "Are you sure you want to restore this backup? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Create safety backup of current state
echo "🛡️  Creating safety backup of current state..."
SAFETY_BACKUP="safety_before_restore_$(date +%Y%m%d_%H%M%S)"
./backup.sh "$SAFETY_BACKUP" >/dev/null 2>&1 || true
echo "   ✓ Safety backup created: $SAFETY_BACKUP"
echo ""

echo "🛑 Stopping services..."
docker compose down
echo "   ✓ Services stopped"

echo "📥 Step 1/5: Restoring PostgreSQL databases..."
# Start only PostgreSQL for restore
docker compose up -d postgres
sleep 5

# Drop and recreate databases
docker compose exec -T postgres psql -U journalism -c "DROP DATABASE IF EXISTS journalism;"
docker compose exec -T postgres psql -U journalism -c "DROP DATABASE IF EXISTS nextcloud;"
docker compose exec -T postgres psql -U journalism -c "CREATE DATABASE journalism;"
docker compose exec -T postgres psql -U journalism -c "CREATE DATABASE nextcloud;"

# Restore databases
gunzip < "$BACKUP_PATH/journalism_db.sql.gz" | docker compose exec -T postgres psql -U journalism journalism
gunzip < "$BACKUP_PATH/nextcloud_db.sql.gz" | docker compose exec -T postgres psql -U journalism nextcloud
echo "   ✓ PostgreSQL databases restored"

echo "📥 Step 2/5: Restoring Nextcloud user data..."
# Remove old volume data and restore
docker run --rm \
  -v journalism-dashboard_nextcloud-data:/target \
  alpine sh -c "rm -rf /target/* /target/..?* /target/.[!.]*"

docker run --rm \
  -v "$PWD/$BACKUP_PATH":/backup:ro \
  -v journalism-dashboard_nextcloud-data:/target \
  alpine tar xzf /backup/nextcloud_data.tar.gz -C /target
echo "   ✓ Nextcloud user data restored"

echo "📥 Step 3/5: Restoring evidence storage..."
docker run --rm \
  -v journalism-dashboard_evidence-storage:/target \
  alpine sh -c "rm -rf /target/* /target/..?* /target/.[!.]*"

docker run --rm \
  -v "$PWD/$BACKUP_PATH":/backup:ro \
  -v journalism-dashboard_evidence-storage:/target \
  alpine tar xzf /backup/evidence_storage.tar.gz -C /target
echo "   ✓ Evidence storage restored"

echo "📥 Step 4/5: Restoring dashboard data..."
docker run --rm \
  -v journalism-dashboard_dashboard-data:/target \
  alpine sh -c "rm -rf /target/* /target/..?* /target/.[!.]*"

docker run --rm \
  -v "$PWD/$BACKUP_PATH":/backup:ro \
  -v journalism-dashboard_dashboard-data:/target \
  alpine tar xzf /backup/dashboard_data.tar.gz -C /target
echo "   ✓ Dashboard data restored"

echo "📥 Step 5/5: Restoring configuration..."
if [ -f "$BACKUP_PATH/.env.backup" ]; then
  cp "$BACKUP_PATH/.env.backup" .env
  echo "   ✓ .env restored"
else
  echo "   ⚠ No .env file in backup"
fi
echo ""

echo "🚀 Starting all services..."
docker compose up -d
echo "   ✓ Services started"

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

echo ""
echo "=================================================="
echo "✅ Restore completed successfully!"
echo "=================================================="
echo ""
echo "Restored from: $BACKUP_NAME"
echo "Safety backup: $SAFETY_BACKUP"
echo ""
echo "🔍 Verifying Nextcloud users..."
docker compose exec journalism-dashboard su -s /bin/bash www-data -c "php /var/www/nextcloud/occ user:list" || true
echo ""
echo "💡 Test your login at:"
echo "   Dashboard: http://localhost:3001"
echo "   Nextcloud: http://localhost:8080"
echo "=================================================="
