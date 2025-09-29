# Production-optimized Frontend Dockerfile
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy root package files for workspace setup
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy frontend package files
COPY frontend/package.json ./frontend/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies using workspace
RUN pnpm install --frozen-lockfile

# Copy frontend source code
COPY frontend/ ./frontend/

# Copy anchor exports for frontend integration
COPY frontend/src/shared/anchor/ ./frontend/src/shared/anchor/

# Copy production environment variables
COPY docker/frontend/.env.production ./frontend/.env.production

# Build the frontend application
WORKDIR /app/frontend
RUN pnpm run build

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
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Set proper permissions for nginx content
RUN chmod -R 755 /usr/share/nginx/html

# Add production health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh

# Expose port 80
EXPOSE 80

# Start nginx (will run as root, which is standard for nginx containers)
CMD ["nginx", "-g", "daemon off;"]
