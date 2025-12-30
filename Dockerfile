# Multi-stage build for Journalism Dashboard with PostgreSQL + Redis + Nextcloud
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Production with PostgreSQL + Nextcloud (no MariaDB needed!)
FROM debian:bookworm-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # Node.js
    curl \
    gnupg \
    # PostgreSQL (for both Nextcloud + Journalism DB)
    postgresql-15 \
    postgresql-contrib-15 \
    # Redis
    redis-server \
    # Apache & PHP for Nextcloud
    apache2 \
    libapache2-mod-php8.2 \
    php8.2 \
    php8.2-fpm \
    php8.2-gd \
    php8.2-pgsql \
    php8.2-curl \
    php8.2-mbstring \
    php8.2-intl \
    php8.2-gmp \
    php8.2-bcmath \
    php8.2-xml \
    php8.2-zip \
    php8.2-imagick \
    php8.2-redis \
    php8.2-apcu \
    # Tools
    supervisor \
    wget \
    unzip \
    cron \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install production dependencies
ENV NODE_ENV=production
RUN npm install --production && npm cache clean --force

# Copy backend source
COPY backend/ ./

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/frontend/dist ./public

# Create necessary directories
RUN mkdir -p /app/data \
    /app/evidence \
    /var/lib/postgresql/data \
    /var/run/postgresql \
    /var/log/supervisor \
    /var/www/nextcloud

# Download and install Nextcloud
ENV NEXTCLOUD_VERSION=28.0.2
RUN wget -q https://download.nextcloud.com/server/releases/nextcloud-${NEXTCLOUD_VERSION}.zip -O /tmp/nextcloud.zip \
    && unzip -q /tmp/nextcloud.zip -d /var/www/ \
    && rm /tmp/nextcloud.zip \
    && chown -R www-data:www-data /var/www/nextcloud \
    && mkdir -p /var/www/nextcloud/data \
    && chown -R www-data:www-data /var/www/nextcloud/data

# Copy database migrations
COPY backend/migrations /app/migrations

# Configure Apache for Nextcloud
RUN a2enmod rewrite headers env dir mime setenvif ssl \
    && a2dissite 000-default

# Copy Apache config for Nextcloud
COPY docker/nextcloud.conf /etc/apache2/sites-available/nextcloud.conf
RUN a2ensite nextcloud

# Configure Apache to listen on port 8080 (permanent fix)
RUN sed -i 's/^Listen 80$/Listen 8080/' /etc/apache2/ports.conf

# Copy supervisord configuration
COPY docker/supervisord-minimal.conf /etc/supervisor/conf.d/supervisord.conf

# Copy startup script and version file
COPY docker/start-minimal.sh /app/start-minimal.sh
COPY VERSION /app/VERSION
RUN chmod +x /app/start-minimal.sh

# Set up PostgreSQL user and permissions
RUN chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql && \
    chmod 2777 /var/run/postgresql

# Metadata labels
LABEL org.opencontainers.image.title="Journalism Dashboard" \
      org.opencontainers.image.description="All-in-one journalism research platform with Nextcloud integration" \
      org.opencontainers.image.version="0.7.0" \
      org.opencontainers.image.vendor="Journalism Dashboard Project" \
      org.opencontainers.image.url="https://github.com/laurenciusMD/journalism-dashboard" \
      org.opencontainers.image.source="https://github.com/laurenciusMD/journalism-dashboard" \
      org.opencontainers.image.documentation="https://github.com/laurenciusMD/journalism-dashboard/blob/main/README.md"

# Expose ports
EXPOSE 3001 8080

# Health check - longer start period for initial DB setup and Nextcloud installation
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=3 \
  CMD curl -f http://localhost:3001/api/health && curl -f http://localhost:8080/status.php || exit 1

# Use startup script
ENTRYPOINT ["/app/start-minimal.sh"]
