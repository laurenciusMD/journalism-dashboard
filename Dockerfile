# Multi-stage build for Journalism Dashboard with PostgreSQL + Redis
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

# Stage 2: Production with PostgreSQL + Redis
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-15 \
    postgresql-contrib-15 \
    redis-server \
    supervisor \
    dumb-init \
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
    /var/log/supervisor

# Copy database migrations
COPY backend/migrations /app/migrations

# Copy supervisord configuration
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy startup script
COPY docker/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Set up PostgreSQL user and permissions
RUN chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql && \
    chmod 2777 /var/run/postgresql

# Expose ports
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init and start script
ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/start.sh"]
