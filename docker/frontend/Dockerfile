# Production-optimized Frontend Dockerfile
FROM oven/bun:alpine as builder

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY frontend/package.json frontend/bun.lock ./

# Install ALL dependencies (including devDependencies for build)
RUN bun install --frozen-lockfile

# Copy source code
COPY frontend/ .

# Copy production environment variables
COPY docker/frontend/.env.production .env.production

# Build the application for production
RUN bun run build

# Production runtime stage
FROM nginx:alpine

# Install curl for health checks and remove package cache
RUN apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

# Copy optimized nginx configuration
COPY docker/frontend/nginx.conf /etc/nginx/nginx.conf

# Copy health check script
COPY docker/frontend/healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Set proper permissions for nginx content
RUN chmod -R 755 /usr/share/nginx/html

# Add production health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh

# Expose port 80
EXPOSE 80

# Start nginx (will run as root, which is standard for nginx containers)
CMD ["nginx", "-g", "daemon off;"]
