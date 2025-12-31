#!/bin/bash

# ============================================================================
# Quill - Safe Update Script
# ============================================================================
# This script safely updates the Journalism Dashboard without losing data
# Version: 1.0.0
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================================================
# Pre-Update Checks
# ============================================================================

pre_update_checks() {
    print_header "Pre-Update Checks"

    # Check if we're in the right directory
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found. Are you in the journalism-dashboard directory?"
        exit 1
    fi

    # Check if docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    # Check if containers are running
    if ! docker compose ps | grep -q "journalism-dashboard"; then
        print_warning "Containers are not running. Will start them after update."
    fi

    print_success "Pre-update checks passed"
}

# ============================================================================
# Create Backup
# ============================================================================

create_backup() {
    print_header "Creating Backup (Optional)"

    read -p "Do you want to create a backup before updating? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        BACKUP_DIR="$HOME/quill-backups"
        BACKUP_FILE="$BACKUP_DIR/quill-backup-$(date +%Y%m%d-%H%M%S).tar.gz"

        mkdir -p "$BACKUP_DIR"

        print_info "Creating backup of Docker volumes..."
        print_info "This may take a few minutes..."

        docker run --rm \
            -v journalism-dashboard_nextcloud-data:/data/nextcloud \
            -v journalism-dashboard_postgres-data:/data/postgres \
            -v journalism-dashboard_dashboard-data:/data/dashboard \
            -v "$BACKUP_DIR:/backup" \
            ubuntu tar czf "/backup/$(basename $BACKUP_FILE)" /data 2>/dev/null

        if [ -f "$BACKUP_FILE" ]; then
            BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            print_success "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
            print_info "To restore: tar xzf $BACKUP_FILE"
        else
            print_warning "Backup creation skipped or failed"
        fi
    else
        print_info "Skipping backup..."
    fi
}

# ============================================================================
# Git Update
# ============================================================================

git_update() {
    print_header "Updating Code from Git"

    # Store current branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    print_info "Current branch: $CURRENT_BRANCH"

    # Store current commit for potential rollback
    PREVIOUS_COMMIT=$(git rev-parse HEAD)
    print_info "Current commit: ${PREVIOUS_COMMIT:0:8}"

    # Fetch latest changes
    print_info "Fetching latest changes..."
    git fetch origin

    # Check if there are updates
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u})

    if [ "$LOCAL" = "$REMOTE" ]; then
        print_warning "Already up to date! No new changes."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Update cancelled."
            exit 0
        fi
    else
        print_info "New changes available!"

        # Show what will be updated
        print_info "Changes since last update:"
        git log --oneline --decorate --color HEAD..@{u} | head -10
        echo

        read -p "Pull these changes? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            print_info "Update cancelled."
            exit 0
        fi
    fi

    # Pull changes
    print_info "Pulling latest changes..."
    if git pull; then
        NEW_COMMIT=$(git rev-parse HEAD)
        print_success "Code updated to commit: ${NEW_COMMIT:0:8}"

        # Save commit info for potential rollback
        echo "$PREVIOUS_COMMIT" > .last_update_commit
    else
        print_error "Git pull failed. Please resolve conflicts manually."
        exit 1
    fi
}

# ============================================================================
# Update Docker Containers
# ============================================================================

update_containers() {
    print_header "Updating Docker Containers"

    print_info "Stopping containers..."
    docker compose down

    print_info "Rebuilding journalism-dashboard container..."
    docker compose build --no-cache journalism-dashboard

    print_info "Starting all containers..."
    docker compose up -d

    print_success "Containers updated and started"
}

# ============================================================================
# Health Check
# ============================================================================

health_check() {
    print_header "Health Check"

    print_info "Waiting for services to start..."
    sleep 10

    # Check container status
    print_info "Checking container health..."

    UNHEALTHY_COUNT=0
    MAX_WAIT=60  # 60 seconds max wait
    WAITED=0

    while [ $WAITED -lt $MAX_WAIT ]; do
        if docker compose ps | grep -q "unhealthy"; then
            print_warning "Some services still starting... ($WAITED/$MAX_WAIT seconds)"
            sleep 5
            WAITED=$((WAITED + 5))
        else
            break
        fi
    done

    # Final status check
    echo ""
    docker compose ps

    # Check if dashboard is responding
    print_info "Testing dashboard API..."
    sleep 5

    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        print_success "Dashboard is responding!"
    else
        print_warning "Dashboard API not responding yet. Check logs with: docker compose logs -f journalism-dashboard"
    fi

    # Check if nextcloud is responding
    print_info "Testing Nextcloud..."
    if curl -f http://localhost:8080/status.php > /dev/null 2>&1; then
        print_success "Nextcloud is responding!"
    else
        print_warning "Nextcloud not responding yet. It may still be starting."
    fi
}

# ============================================================================
# Rollback Function
# ============================================================================

rollback() {
    print_header "Rollback to Previous Version"

    if [ ! -f ".last_update_commit" ]; then
        print_error "No previous commit found. Cannot rollback."
        exit 1
    fi

    PREVIOUS_COMMIT=$(cat .last_update_commit)

    print_warning "This will rollback to commit: ${PREVIOUS_COMMIT:0:8}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Rolling back..."
        git reset --hard "$PREVIOUS_COMMIT"

        print_info "Rebuilding containers with old code..."
        docker compose down
        docker compose build --no-cache journalism-dashboard
        docker compose up -d

        print_success "Rollback complete!"
        rm .last_update_commit
    else
        print_info "Rollback cancelled."
    fi
}

# ============================================================================
# Main Update Flow
# ============================================================================

main() {
    clear

    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║   ██████╗ ██╗   ██╗██╗██╗     ██╗                           ║"
    echo "║  ██╔═══██╗██║   ██║██║██║     ██║                           ║"
    echo "║  ██║   ██║██║   ██║██║██║     ██║                           ║"
    echo "║  ██║▄▄ ██║██║   ██║██║██║     ██║                           ║"
    echo "║  ╚██████╔╝╚██████╔╝██║███████╗███████╗                      ║"
    echo "║   ╚══▀▀═╝  ╚═════╝ ╚═╝╚══════╝╚══════╝                      ║"
    echo "║                                                              ║"
    echo "║              Safe Update Script v1.0.0                       ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"

    print_warning "This script will update your Quill installation."
    print_info "Your Nextcloud data, users, and files will be preserved!"
    echo ""
    read -p "Continue with update? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_info "Update cancelled."
        exit 0
    fi

    # Run update steps
    pre_update_checks
    create_backup
    git_update
    update_containers
    health_check

    # Show summary
    print_header "Update Complete!"

    echo -e "${GREEN}✅ Update successful!${NC}\n"

    LOCAL_IP=$(hostname -I | awk '{print $1}')

    echo -e "${BLUE}Access your services:${NC}"
    echo -e "  📰 Dashboard:  ${GREEN}http://localhost:3001${NC}"
    echo -e "  ☁️  Nextcloud:  ${GREEN}http://localhost:8080${NC}"
    echo -e "  🌐 External:   ${GREEN}http://$LOCAL_IP:3001${NC}"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo -e "  ${YELLOW}docker compose ps${NC}        - Check status"
    echo -e "  ${YELLOW}docker compose logs -f${NC}   - View logs"
    echo -e "  ${YELLOW}./update.sh --rollback${NC}   - Rollback to previous version"
    echo ""
    echo -e "${YELLOW}💡 Your Nextcloud data and users are safe and unchanged!${NC}"
    echo ""
}

# ============================================================================
# Script Entry Point
# ============================================================================

# Handle command-line arguments
case "${1:-}" in
    --rollback)
        rollback
        exit 0
        ;;
    --help|-h)
        echo "Quill Safe Update Script"
        echo ""
        echo "Usage:"
        echo "  ./update.sh           - Update to latest version"
        echo "  ./update.sh --rollback - Rollback to previous version"
        echo "  ./update.sh --help     - Show this help"
        echo ""
        exit 0
        ;;
esac

# Catch Ctrl+C
trap 'echo -e "\n${RED}Update cancelled by user.${NC}"; exit 1' INT

# Change to script directory
cd "$(dirname "$0")"

# Run main function
main
