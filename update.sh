#!/bin/bash
#
# Update Script - Wrapper for Smart Update System
# Provides backwards compatibility with old update.sh
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔄 Journalism Dashboard Update"
echo ""
echo "Using smart update system..."
echo "(For legacy update: ./update-legacy.sh)"
echo ""

# Forward all arguments to smart-update.sh
exec ./smart-update.sh "$@"
