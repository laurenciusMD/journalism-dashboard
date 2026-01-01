#!/bin/bash
#
# Journalism Dashboard - Backup Script
# Creates complete backup of all data
#
# Usage: ./backup.sh [backup-name]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${1:-backup_${TIMESTAMP}}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

echo "=================================================="
echo "🔒 Journalism Dashboard - Complete Backup"
echo "=================================================="
echo "Backup name: $BACKUP_NAME"
echo "Backup path: $BACKUP_PATH"
echo ""

# Create backup directory
mkdir -p "$BACKUP_PATH"

echo "📦 Step 1/5: Backing up PostgreSQL databases..."
# Backup PostgreSQL (both journalism and nextcloud databases)
docker compose exec -T postgres pg_dump -U journalism journalism | gzip > "$BACKUP_PATH/journalism_db.sql.gz"
docker compose exec -T postgres pg_dump -U journalism nextcloud | gzip > "$BACKUP_PATH/nextcloud_db.sql.gz"
echo "   ✓ PostgreSQL databases backed up"

echo "📦 Step 2/5: Backing up Nextcloud user data..."
# Backup Nextcloud data directory
docker run --rm \
  -v journalism-dashboard_nextcloud-data:/source:ro \
  -v "$PWD/$BACKUP_PATH":/backup \
  alpine tar czf /backup/nextcloud_data.tar.gz -C /source .
echo "   ✓ Nextcloud user data backed up"

echo "📦 Step 3/5: Backing up evidence storage..."
# Backup evidence files
docker run --rm \
  -v journalism-dashboard_evidence-storage:/source:ro \
  -v "$PWD/$BACKUP_PATH":/backup \
  alpine tar czf /backup/evidence_storage.tar.gz -C /source .
echo "   ✓ Evidence storage backed up"

echo "📦 Step 4/5: Backing up dashboard data..."
# Backup dashboard application data
docker run --rm \
  -v journalism-dashboard_dashboard-data:/source:ro \
  -v "$PWD/$BACKUP_PATH":/backup \
  alpine tar czf /backup/dashboard_data.tar.gz -C /source .
echo "   ✓ Dashboard data backed up"

echo "📦 Step 5/5: Backing up configuration..."
# Backup configuration files
cp .env "$BACKUP_PATH/.env.backup" 2>/dev/null || echo "   ⚠ No .env file found"
cp docker-compose.yml "$BACKUP_PATH/docker-compose.yml"
echo "   ✓ Configuration files backed up"

# Create backup manifest
cat > "$BACKUP_PATH/manifest.txt" << EOF
Journalism Dashboard Backup
===========================
Date: $(date)
Hostname: $(hostname)
Version: $(grep -o '"version": "[^"]*"' backend/package.json | cut -d'"' -f4)

Contents:
- journalism_db.sql.gz (PostgreSQL: journalism database)
- nextcloud_db.sql.gz (PostgreSQL: nextcloud database)
- nextcloud_data.tar.gz (Nextcloud user files)
- evidence_storage.tar.gz (Investigation evidence files)
- dashboard_data.tar.gz (Dashboard application data)
- docker-compose.yml (Docker configuration)
- .env.backup (Environment variables)

Docker Volumes:
$(docker volume ls --filter name=journalism)

Nextcloud Users:
$(docker compose exec -T journalism-dashboard su -s /bin/bash www-data -c "php /var/www/nextcloud/occ user:list" 2>/dev/null || echo "Could not list users")

Restore Command:
  ./restore.sh $BACKUP_NAME
EOF

# Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)

echo ""
echo "=================================================="
echo "✅ Backup completed successfully!"
echo "=================================================="
echo "Location: $BACKUP_PATH"
echo "Size: $BACKUP_SIZE"
echo ""
echo "Backup contents:"
ls -lh "$BACKUP_PATH/"
echo ""
echo "To restore this backup:"
echo "  ./restore.sh $BACKUP_NAME"
echo ""
echo "💡 Tip: Store backups off-server for disaster recovery!"
echo "=================================================="
