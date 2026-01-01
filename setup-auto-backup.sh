#!/bin/bash
#
# Setup Automated Backups
# Configures daily backups with automatic cleanup
#

set -e

echo "=================================================="
echo "🔒 Setup Automated Backups"
echo "=================================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (sudo ./setup-auto-backup.sh)"
  exit 1
fi

# Get journalism-dashboard directory
DASHBOARD_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📁 Dashboard directory: $DASHBOARD_DIR"
echo ""

# Create log directory
mkdir -p /var/log/journalism
echo "✓ Created log directory: /var/log/journalism"

# Create cron job
CRON_FILE="/etc/cron.d/journalism-backup"

cat > "$CRON_FILE" << EOF
# Journalism Dashboard Automated Backups
# Created: $(date)

# Daily backup at 2:00 AM with verification
0 2 * * * root cd $DASHBOARD_DIR && ./backup.sh "daily_\$(date +\%Y\%m\%d)" >> /var/log/journalism/backup.log 2>&1 && ./verify-data.sh >> /var/log/journalism/verify.log 2>&1

# Weekly backup on Sunday at 3:00 AM
0 3 * * 0 root cd $DASHBOARD_DIR && ./backup.sh "weekly_\$(date +\%Y\%m\%d)" >> /var/log/journalism/backup.log 2>&1

# Monthly backup on 1st day at 4:00 AM
0 4 1 * * root cd $DASHBOARD_DIR && ./backup.sh "monthly_\$(date +\%Y\%m\%d)" >> /var/log/journalism/backup.log 2>&1

# Cleanup: Remove daily backups older than 7 days (at 5:00 AM)
0 5 * * * root find $DASHBOARD_DIR/backups -type d -name "daily_*" -mtime +7 -exec rm -rf {} \; 2>/dev/null

# Cleanup: Remove weekly backups older than 30 days
0 5 * * 1 root find $DASHBOARD_DIR/backups -type d -name "weekly_*" -mtime +30 -exec rm -rf {} \; 2>/dev/null

# Cleanup: Remove monthly backups older than 365 days
0 5 1 * * root find $DASHBOARD_DIR/backups -type d -name "monthly_*" -mtime +365 -exec rm -rf {} \; 2>/dev/null
EOF

chmod 644 "$CRON_FILE"
echo "✓ Created cron job: $CRON_FILE"
echo ""

# Create logrotate config
LOGROTATE_FILE="/etc/logrotate.d/journalism"

cat > "$LOGROTATE_FILE" << EOF
# Journalism Dashboard Log Rotation
/var/log/journalism/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
}
EOF

chmod 644 "$LOGROTATE_FILE"
echo "✓ Created logrotate config: $LOGROTATE_FILE"
echo ""

# Restart cron
systemctl restart cron 2>/dev/null || service cron restart 2>/dev/null || true
echo "✓ Restarted cron service"
echo ""

# Create initial backup
echo "📦 Creating initial backup..."
cd "$DASHBOARD_DIR"
./backup.sh "initial_$(date +%Y%m%d_%H%M%S)"
echo ""

# Run verification
echo "🔍 Running data verification..."
./verify-data.sh
echo ""

echo "=================================================="
echo "✅ Automated Backups Configured!"
echo "=================================================="
echo ""
echo "Backup Schedule:"
echo "  • Daily:   2:00 AM (kept for 7 days)"
echo "  • Weekly:  Sunday 3:00 AM (kept for 30 days)"
echo "  • Monthly: 1st day 4:00 AM (kept for 365 days)"
echo ""
echo "Logs:"
echo "  • Backup log:  /var/log/journalism/backup.log"
echo "  • Verify log:  /var/log/journalism/verify.log"
echo ""
echo "Manual Commands:"
echo "  • Create backup:    ./backup.sh"
echo "  • Verify data:      ./verify-data.sh"
echo "  • Restore backup:   ./restore.sh <backup-name>"
echo "  • List backups:     ls -lh ./backups/"
echo ""
echo "💡 Tip: Set up off-site backup sync!"
echo "   See: BACKUP_RESTORE.md"
echo "=================================================="
