#!/bin/bash

# ============================================================================
# Quill - Journalism Dashboard - Automated Ubuntu Setup Script
# ============================================================================
# This script automates the complete installation of Quill on a blank Ubuntu system
# Version: 1.0.0
# Author: Laurencius
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
# System Check
# ============================================================================

check_system() {
    print_header "Checking System Requirements"

    # Check if Ubuntu
    if [ ! -f /etc/os-release ]; then
        print_error "Cannot determine OS. This script is for Ubuntu only."
        exit 1
    fi

    source /etc/os-release
    if [[ "$ID" != "ubuntu" ]]; then
        print_error "This script is designed for Ubuntu. Detected: $ID"
        exit 1
    fi

    print_success "Operating System: $PRETTY_NAME"

    # Check if running as root (we need sudo)
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root. It's recommended to run as normal user with sudo."
    fi

    # Check internet connection
    if ! ping -c 1 google.com &> /dev/null; then
        print_error "No internet connection detected. Please connect to the internet."
        exit 1
    fi
    print_success "Internet connection: OK"

    # Check available disk space (need at least 10GB)
    available_space=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$available_space" -lt 10 ]; then
        print_error "Not enough disk space. Need at least 10GB, available: ${available_space}GB"
        exit 1
    fi
    print_success "Disk space: ${available_space}GB available"
}

# ============================================================================
# Install System Dependencies
# ============================================================================

install_dependencies() {
    print_header "Installing System Dependencies"

    print_info "Updating package lists..."
    sudo apt update

    print_info "Upgrading existing packages..."
    sudo apt upgrade -y

    print_info "Installing basic tools..."
    sudo apt install -y \
        curl \
        wget \
        git \
        ca-certificates \
        gnupg \
        lsb-release \
        software-properties-common \
        apt-transport-https

    print_success "System dependencies installed"
}

# ============================================================================
# Install Docker
# ============================================================================

install_docker() {
    print_header "Installing Docker"

    # Check if Docker is already installed
    if command -v docker &> /dev/null; then
        print_warning "Docker is already installed ($(docker --version))"
        read -p "Do you want to reinstall? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return
        fi
    fi

    print_info "Adding Docker GPG key..."
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    print_info "Adding Docker repository..."
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    print_info "Installing Docker Engine..."
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    print_info "Adding current user to docker group..."
    sudo usermod -aG docker $USER

    print_success "Docker installed successfully: $(docker --version)"
    print_success "Docker Compose installed: $(docker compose version)"

    print_warning "You may need to log out and back in for group changes to take effect."
}

# ============================================================================
# Clone Repository
# ============================================================================

clone_repository() {
    print_header "Cloning Quill Repository"

    # Default installation directory
    INSTALL_DIR="$HOME/journalism-dashboard"

    # Check if directory already exists
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "Directory $INSTALL_DIR already exists."
        read -p "Do you want to remove it and clone fresh? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$INSTALL_DIR"
        else
            print_info "Using existing directory..."
            cd "$INSTALL_DIR"
            git pull
            return
        fi
    fi

    print_info "Cloning from GitHub..."
    git clone https://github.com/laurenciusMD/journalism-dashboard.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"

    print_success "Repository cloned to: $INSTALL_DIR"
}

# ============================================================================
# Configure Environment
# ============================================================================

configure_environment() {
    print_header "Configuring Environment Variables"

    # Check if .env already exists
    if [ -f .env ]; then
        print_warning ".env file already exists."
        read -p "Do you want to reconfigure? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return
        fi
    fi

    # Copy example file
    cp .env.example .env

    print_info "Please provide the following information:"
    echo

    # Dashboard Username
    read -p "Dashboard Username [admin]: " DASHBOARD_USERNAME
    DASHBOARD_USERNAME=${DASHBOARD_USERNAME:-admin}

    # Dashboard Password
    while true; do
        read -sp "Dashboard Password (min. 8 characters): " DASHBOARD_PASSWORD
        echo
        if [ ${#DASHBOARD_PASSWORD} -lt 8 ]; then
            print_error "Password must be at least 8 characters long."
            continue
        fi
        read -sp "Confirm Password: " DASHBOARD_PASSWORD_CONFIRM
        echo
        if [ "$DASHBOARD_PASSWORD" != "$DASHBOARD_PASSWORD_CONFIRM" ]; then
            print_error "Passwords do not match. Try again."
            continue
        fi
        break
    done

    # Generate secure secrets
    print_info "Generating secure secrets..."
    SESSION_SECRET=$(openssl rand -base64 32)
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    NEXTCLOUD_DB_PASSWORD=$(openssl rand -base64 24)
    NEXTCLOUD_DB_ROOT_PASSWORD=$(openssl rand -base64 24)
    JOURNALISM_DB_PASSWORD=$(openssl rand -base64 24)

    # Update .env file
    print_info "Writing configuration to .env..."

    # Using sed to replace values in .env
    sed -i "s/^DASHBOARD_USERNAME=.*/DASHBOARD_USERNAME=$DASHBOARD_USERNAME/" .env
    sed -i "s/^DASHBOARD_PASSWORD=.*/DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD/" .env
    sed -i "s/^SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
    sed -i "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env
    sed -i "s/^NEXTCLOUD_DB_PASSWORD=.*/NEXTCLOUD_DB_PASSWORD=$NEXTCLOUD_DB_PASSWORD/" .env
    sed -i "s/^NEXTCLOUD_DB_ROOT_PASSWORD=.*/NEXTCLOUD_DB_ROOT_PASSWORD=$NEXTCLOUD_DB_ROOT_PASSWORD/" .env

    # Add JOURNALISM_DB_PASSWORD if not present
    if ! grep -q "^JOURNALISM_DB_PASSWORD=" .env; then
        echo "JOURNALISM_DB_PASSWORD=$JOURNALISM_DB_PASSWORD" >> .env
    else
        sed -i "s/^JOURNALISM_DB_PASSWORD=.*/JOURNALISM_DB_PASSWORD=$JOURNALISM_DB_PASSWORD/" .env
    fi

    print_success "Environment configured successfully"

    # Ask for optional API keys
    echo
    print_info "AI API Keys (optional - you can add these later):"
    echo
    read -p "Do you want to configure AI API keys now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Anthropic (Claude) API Key [skip]: " ANTHROPIC_API_KEY
        if [ -n "$ANTHROPIC_API_KEY" ]; then
            sed -i "s|^ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY|" .env
        fi

        read -p "Google (Gemini) API Key [skip]: " GOOGLE_API_KEY
        if [ -n "$GOOGLE_API_KEY" ]; then
            sed -i "s|^GOOGLE_API_KEY=.*|GOOGLE_API_KEY=$GOOGLE_API_KEY|" .env
        fi

        read -p "OpenAI API Key [skip]: " OPENAI_API_KEY
        if [ -n "$OPENAI_API_KEY" ]; then
            sed -i "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_API_KEY|" .env
        fi
    fi

    print_success "Configuration complete"
}

# ============================================================================
# Start Docker Services
# ============================================================================

start_services() {
    print_header "Starting Docker Services"

    print_info "Starting all services with docker compose..."
    print_warning "First start may take 3-5 minutes to download images and initialize databases."

    # Use newgrp or sg to apply docker group without logout
    if groups | grep -q docker; then
        docker compose up -d
    else
        print_warning "Applying docker group permissions..."
        sg docker -c "docker compose up -d"
    fi

    print_success "Services started!"

    print_info "Waiting for services to become healthy (this may take 1-2 minutes)..."
    sleep 10

    # Wait for services to be healthy (max 3 minutes)
    local max_attempts=36
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker compose ps | grep -q "unhealthy"; then
            print_info "Waiting for services to initialize... ($((attempt * 5))s)"
            sleep 5
            ((attempt++))
        else
            print_success "All services are healthy!"
            break
        fi
    done

    if [ $attempt -eq $max_attempts ]; then
        print_warning "Some services may still be initializing. Check with: docker compose ps"
    fi
}

# ============================================================================
# Display Access Information
# ============================================================================

show_access_info() {
    print_header "Installation Complete!"

    # Get local IP
    LOCAL_IP=$(hostname -I | awk '{print $1}')

    echo -e "${GREEN}Quill has been successfully installed!${NC}\n"

    echo -e "${BLUE}Access your services:${NC}"
    echo -e "  📰 Dashboard:  ${GREEN}http://localhost:3001${NC}"
    echo -e "  ☁️  Nextcloud:  ${GREEN}http://localhost:8080${NC}"
    echo -e "  🔗 API Health: ${GREEN}http://localhost:3001/api/health${NC}"
    echo
    echo -e "${BLUE}From other devices on your network:${NC}"
    echo -e "  📰 Dashboard:  ${GREEN}http://$LOCAL_IP:3001${NC}"
    echo -e "  ☁️  Nextcloud:  ${GREEN}http://$LOCAL_IP:8080${NC}"
    echo
    echo -e "${BLUE}Login Credentials:${NC}"
    echo -e "  Username: ${GREEN}$DASHBOARD_USERNAME${NC}"
    echo -e "  Password: ${GREEN}[your password]${NC}"
    echo -e "  ${YELLOW}(Same credentials for both Dashboard and Nextcloud!)${NC}"
    echo
    echo -e "${BLUE}Useful Commands:${NC}"
    echo -e "  ${YELLOW}cd $INSTALL_DIR${NC}"
    echo -e "  ${YELLOW}docker compose ps${NC}        - Check service status"
    echo -e "  ${YELLOW}docker compose logs -f${NC}   - View logs"
    echo -e "  ${YELLOW}docker compose down${NC}      - Stop services"
    echo -e "  ${YELLOW}docker compose up -d${NC}     - Start services"
    echo -e "  ${YELLOW}docker compose restart${NC}   - Restart services"
    echo
    echo -e "${BLUE}Documentation:${NC}"
    echo -e "  📖 Setup Guide:  ${GREEN}SETUP_UBUNTU.md${NC}"
    echo -e "  📖 README:       ${GREEN}README.md${NC}"
    echo -e "  📖 Roadmap:      ${GREEN}docs/ROADMAP.md${NC}"
    echo
    print_warning "Note: If you see 'permission denied' errors with docker commands,"
    print_warning "you may need to log out and back in, or use: newgrp docker"
    echo
}

# ============================================================================
# Main Installation Flow
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
    echo "║         Journalism Dashboard - Automated Setup               ║"
    echo "║                    Version 1.0.0                             ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"

    print_info "This script will install Quill and all dependencies on your Ubuntu system."
    print_warning "The installation will take approximately 5-10 minutes."
    echo
    read -p "Press Enter to continue or Ctrl+C to cancel..."
    echo

    # Run installation steps
    check_system
    install_dependencies
    install_docker
    clone_repository
    configure_environment
    start_services
    show_access_info

    echo -e "\n${GREEN}🎉 Enjoy using Quill!${NC}\n"
}

# ============================================================================
# Script Entry Point
# ============================================================================

# Catch Ctrl+C and cleanup
trap 'echo -e "\n${RED}Installation cancelled by user.${NC}"; exit 1' INT

# Run main function
main
