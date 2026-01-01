# Multi-stage build for Quill - Journalism Research Platform
# Lightweight: Node.js only (no Nextcloud, Apache, PHP)

# ===== Stage 1: Build Frontend =====
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

# ===== Stage 2: Production Runtime =====
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Create app directory first
WORKDIR /app

# Create app user (Alpine Linux syntax)
RUN addgroup -g 1000 app && \
    adduser -D -u 1000 -G app app

# Copy backend package files
COPY backend/package*.json ./

# Install production dependencies
ENV NODE_ENV=production
RUN npm install --production && npm cache clean --force

# Copy backend source
COPY backend/ ./

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/frontend/dist ./public

# Create necessary directories with proper permissions
RUN mkdir -p /app/data \
    /app/evidence \
    /app/uploads \
    /var/log \
    && chown -R app:app /app

# Copy database migrations
COPY backend/migrations /app/migrations

# Copy version file
COPY VERSION /app/VERSION

# Switch to app user
USER app

# Metadata labels
LABEL org.opencontainers.image.title="Quill - Journalism Research Platform" \
      org.opencontainers.image.description="Lightweight journalism research platform with native user & file management" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.vendor="Laurencius" \
      org.opencontainers.image.authors="Laurencius" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.url="https://github.com/laurenciusMD/journalism-dashboard" \
      org.opencontainers.image.source="https://github.com/laurenciusMD/journalism-dashboard" \
      org.opencontainers.image.documentation="https://github.com/laurenciusMD/journalism-dashboard/blob/main/README.md"

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/index.js"]
