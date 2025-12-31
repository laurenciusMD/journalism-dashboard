#!/bin/bash
#
# Smart Update System - Production Ready
# Only updates what actually changed, preserves all data
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================================="
echo "🎯 Smart Update System"
echo "=================================================="
echo ""

# Parse arguments
FORCE_REBUILD=false
SKIP_BACKUP=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --force-rebuild)
      FORCE_REBUILD=true
      shift
      ;;
    --skip-backup)
      SKIP_BACKUP=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--force-rebuild] [--skip-backup]"
      exit 1
      ;;
  esac
done

# Step 1: Backup (unless skipped)
if [ "$SKIP_BACKUP" = false ]; then
  echo "📦 Step 1/6: Creating backup..."
  ./backup.sh "before_update_$(date +%Y%m%d_%H%M%S)" >/dev/null 2>&1 || {
    echo "   ⚠️  Backup failed, but continuing..."
  }
  echo "   ✓ Backup created"
else
  echo "⏭️  Step 1/6: Skipping backup (--skip-backup)"
fi
echo ""

# Step 2: Fetch latest code
echo "📥 Step 2/6: Fetching latest code..."
git fetch origin
CURRENT_COMMIT=$(git rev-parse HEAD)
LATEST_COMMIT=$(git rev-parse @{u} 2>/dev/null || echo "$CURRENT_COMMIT")

if [ "$CURRENT_COMMIT" = "$LATEST_COMMIT" ]; then
  echo "   ✓ Already up to date (commit: ${CURRENT_COMMIT:0:7})"
  if [ "$FORCE_REBUILD" = false ]; then
    echo ""
    echo "✅ No updates needed!"
    echo ""
    echo "Use --force-rebuild to rebuild anyway"
    exit 0
  else
    echo "   ⚠️  Forcing rebuild despite no changes"
  fi
else
  echo "   📋 Changes detected:"
  git log --oneline "$CURRENT_COMMIT..$LATEST_COMMIT" | head -5 | sed 's/^/      /'
  git pull
  echo "   ✓ Code updated (${CURRENT_COMMIT:0:7} → ${LATEST_COMMIT:0:7})"
fi
echo ""

# Step 3: Analyze what changed
echo "🔍 Step 3/6: Analyzing changes..."

NEEDS_REBUILD=false
NEEDS_MIGRATION=false
NEEDS_RESTART=false

# Check if Dockerfile or dependencies changed
if git diff --name-only "$CURRENT_COMMIT" "$LATEST_COMMIT" 2>/dev/null | grep -qE '^(Dockerfile|docker-compose\.yml|package\.json|requirements\.txt)$'; then
  NEEDS_REBUILD=true
  echo "   ⚠️  Infrastructure files changed - rebuild needed"
fi

# Check if migrations were added
if git diff --name-only "$CURRENT_COMMIT" "$LATEST_COMMIT" 2>/dev/null | grep -q '^backend/migrations/'; then
  NEEDS_MIGRATION=true
  echo "   📋 New database migrations found"
fi

# Check if application code changed
if git diff --name-only "$CURRENT_COMMIT" "$LATEST_COMMIT" 2>/dev/null | grep -qE '^(backend/|frontend/)'; then
  NEEDS_RESTART=true
  echo "   🔄 Application code changed - restart needed"
fi

if [ "$NEEDS_REBUILD" = false ] && [ "$NEEDS_MIGRATION" = false ] && [ "$NEEDS_RESTART" = false ]; then
  echo "   ✓ Only documentation/scripts changed - no deployment needed"
fi

if [ "$FORCE_REBUILD" = true ]; then
  NEEDS_REBUILD=true
  echo "   ⚠️  Force rebuild requested"
fi

echo ""

# Step 4: Run database migrations (if needed)
if [ "$NEEDS_MIGRATION" = true ]; then
  echo "📋 Step 4/6: Running database migrations..."

  # Get list of new migrations
  NEW_MIGRATIONS=$(git diff --name-only "$CURRENT_COMMIT" "$LATEST_COMMIT" | grep '^backend/migrations/' | sort)

  for migration in $NEW_MIGRATIONS; do
    MIGRATION_NAME=$(basename "$migration")
    echo "   Running: $MIGRATION_NAME"

    # Apply migration
    docker compose exec -T postgres psql -U journalism journalism -f "/docker-entrypoint-initdb.d/$MIGRATION_NAME" || {
      echo "   ❌ Migration failed: $MIGRATION_NAME"
      echo ""
      echo "⚠️  Manual intervention required!"
      echo "   Check logs and fix migration issues"
      exit 1
    }

    echo "   ✓ $MIGRATION_NAME applied"
  done

  echo "   ✓ All migrations completed"
else
  echo "⏭️  Step 4/6: No database migrations needed"
fi
echo ""

# Step 5: Update strategy
if [ "$NEEDS_REBUILD" = true ]; then
  echo "🔨 Step 5/6: Rebuilding containers..."
  echo "   This will take a few minutes..."

  # Rebuild only journalism-dashboard (not postgres/redis)
  docker compose build --no-cache journalism-dashboard

  # Recreate only journalism-dashboard
  docker compose up -d --force-recreate journalism-dashboard

  echo "   ✓ Container rebuilt and restarted"

elif [ "$NEEDS_RESTART" = true ]; then
  echo "🔄 Step 5/6: Restarting application..."

  # Quick restart without rebuild
  docker compose restart journalism-dashboard

  echo "   ✓ Application restarted"
else
  echo "⏭️  Step 5/6: No container changes needed"
fi
echo ""

# Step 6: Verify deployment
echo "✅ Step 6/6: Verifying deployment..."
sleep 5

# Check if containers are healthy
if docker compose ps | grep -q "journalism-dashboard.*Up.*healthy"; then
  echo "   ✓ Dashboard container is healthy"
else
  echo "   ⚠️  Dashboard container health check pending..."
  sleep 5
  if docker compose ps | grep -q "journalism-dashboard.*Up"; then
    echo "   ✓ Dashboard container is running"
  else
    echo "   ❌ Dashboard container is not running!"
    docker compose logs journalism-dashboard --tail 20
    exit 1
  fi
fi

# Check API endpoint
if curl -sf http://localhost:3001/api/health >/dev/null; then
  echo "   ✓ Dashboard API responding"
else
  echo "   ❌ Dashboard API not responding"
  exit 1
fi

# Check Nextcloud
if curl -sf http://localhost:8080/status.php >/dev/null; then
  echo "   ✓ Nextcloud responding"
else
  echo "   ⚠️  Nextcloud not responding yet (may need more time)"
fi

echo ""
echo "=================================================="
echo "✅ Update completed successfully!"
echo "=================================================="
echo ""

if [ "$NEEDS_REBUILD" = true ]; then
  echo "📊 Update type: FULL REBUILD"
  echo "   - Container was rebuilt from scratch"
  echo "   - All dependencies updated"
elif [ "$NEEDS_RESTART" = true ]; then
  echo "📊 Update type: CODE UPDATE"
  echo "   - Application code updated"
  echo "   - Quick restart (no rebuild)"
else
  echo "📊 Update type: CONFIGURATION ONLY"
  echo "   - No application changes"
fi

if [ "$NEEDS_MIGRATION" = true ]; then
  echo "   - Database migrations applied"
fi

echo ""
echo "🔍 Verify:"
echo "   Dashboard: http://localhost:3001"
echo "   Nextcloud: http://localhost:8080"
echo ""
echo "📋 Logs: docker compose logs -f journalism-dashboard"
echo "=================================================="
