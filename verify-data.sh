#!/bin/bash
#
# Journalism Dashboard - Data Integrity Verification
# Checks that all critical data is present and healthy
#
# Usage: ./verify-data.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================================="
echo "🔍 Journalism Dashboard - Data Verification"
echo "=================================================="
echo ""

ERRORS=0
WARNINGS=0

# Check containers are running
echo "📦 Checking containers..."
if docker compose ps | grep -q "journalism-dashboard.*Up"; then
  echo "   ✓ journalism-dashboard is running"
else
  echo "   ❌ journalism-dashboard is NOT running"
  ((ERRORS++))
fi

if docker compose ps | grep -q "journalism-postgres.*Up"; then
  echo "   ✓ journalism-postgres is running"
else
  echo "   ❌ journalism-postgres is NOT running"
  ((ERRORS++))
fi

if docker compose ps | grep -q "journalism-redis.*Up"; then
  echo "   ✓ journalism-redis is running"
else
  echo "   ❌ journalism-redis is NOT running"
  ((ERRORS++))
fi
echo ""

# Check volumes exist
echo "📂 Checking Docker volumes..."
for volume in nextcloud-data dashboard-data postgres-data redis-data evidence-storage; do
  if docker volume inspect "journalism-dashboard_${volume}" >/dev/null 2>&1; then
    SIZE=$(docker run --rm -v "journalism-dashboard_${volume}:/data:ro" alpine du -sh /data 2>/dev/null | cut -f1)
    echo "   ✓ ${volume}: ${SIZE}"
  else
    echo "   ❌ ${volume}: NOT FOUND"
    ((ERRORS++))
  fi
done
echo ""

# Check PostgreSQL databases
echo "🗄️  Checking PostgreSQL databases..."
if docker compose exec -T postgres psql -U journalism -lqt | grep -q journalism; then
  TABLES=$(docker compose exec -T postgres psql -U journalism journalism -c "\dt" 2>/dev/null | grep -c "public" || echo "0")
  echo "   ✓ journalism database exists ($TABLES tables)"
else
  echo "   ❌ journalism database NOT FOUND"
  ((ERRORS++))
fi

if docker compose exec -T postgres psql -U journalism -lqt | grep -q nextcloud; then
  TABLES=$(docker compose exec -T postgres psql -U journalism nextcloud -c "\dt" 2>/dev/null | grep -c "public" || echo "0")
  echo "   ✓ nextcloud database exists ($TABLES tables)"
else
  echo "   ❌ nextcloud database NOT FOUND"
  ((ERRORS++))
fi
echo ""

# Check Nextcloud users
echo "👥 Checking Nextcloud users..."
USERS=$(docker compose exec -T journalism-dashboard su -s /bin/bash www-data -c "php /var/www/nextcloud/occ user:list" 2>/dev/null | grep -c ":" || echo "0")
if [ "$USERS" -gt 0 ]; then
  echo "   ✓ Found $USERS Nextcloud user(s):"
  docker compose exec journalism-dashboard su -s /bin/bash www-data -c "php /var/www/nextcloud/occ user:list" 2>/dev/null | sed 's/^/     /'
else
  echo "   ⚠️  WARNING: No Nextcloud users found!"
  ((WARNINGS++))
fi
echo ""

# Check Nextcloud data directory
echo "📁 Checking Nextcloud data directory..."
if docker compose exec journalism-dashboard test -d /var/www/html/data; then
  DATA_SIZE=$(docker compose exec journalism-dashboard du -sh /var/www/html/data 2>/dev/null | cut -f1)
  echo "   ✓ Nextcloud data directory exists: $DATA_SIZE"
else
  echo "   ❌ Nextcloud data directory NOT FOUND"
  ((ERRORS++))
fi
echo ""

# Check API endpoints
echo "🌐 Checking API endpoints..."
if curl -sf http://localhost:3001/api/health >/dev/null; then
  echo "   ✓ Dashboard API is responding"
else
  echo "   ❌ Dashboard API is NOT responding"
  ((ERRORS++))
fi

if curl -sf http://localhost:8080/status.php >/dev/null; then
  echo "   ✓ Nextcloud is responding"
else
  echo "   ❌ Nextcloud is NOT responding"
  ((ERRORS++))
fi
echo ""

# Check recent backups
echo "💾 Checking backups..."
if [ -d "./backups" ]; then
  BACKUP_COUNT=$(ls -1 ./backups 2>/dev/null | wc -l)
  if [ "$BACKUP_COUNT" -gt 0 ]; then
    LATEST_BACKUP=$(ls -t ./backups | head -1)
    BACKUP_AGE=$(find "./backups/$LATEST_BACKUP" -mtime +7 2>/dev/null)
    echo "   ✓ Found $BACKUP_COUNT backup(s)"
    echo "     Latest: $LATEST_BACKUP"
    if [ -n "$BACKUP_AGE" ]; then
      echo "     ⚠️  Latest backup is older than 7 days"
      ((WARNINGS++))
    fi
  else
    echo "   ⚠️  WARNING: No backups found!"
    echo "     Run: ./backup.sh"
    ((WARNINGS++))
  fi
else
  echo "   ⚠️  WARNING: No backup directory found!"
  echo "     Run: ./backup.sh"
  ((WARNINGS++))
fi
echo ""

# Summary
echo "=================================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ All checks passed!"
elif [ $ERRORS -eq 0 ]; then
  echo "⚠️  Checks passed with $WARNINGS warning(s)"
else
  echo "❌ Found $ERRORS error(s) and $WARNINGS warning(s)"
fi
echo "=================================================="

exit $ERRORS
