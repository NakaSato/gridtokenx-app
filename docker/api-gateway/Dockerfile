# Stage 1: Build stage
FROM rust:1.89-slim AS builder

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy API Gateway specific files only for dependency caching
COPY api-gateway/Cargo.toml ./Cargo.toml
COPY api-gateway/.sqlx ./.sqlx

# Create src directory and dummy main.rs for dependency caching
RUN mkdir -p src && echo "fn main() {}" > src/main.rs

# Build dependencies first (for better caching)
RUN cargo fetch && cargo build --release && rm -rf src/

# Copy API Gateway source
COPY api-gateway/src ./src/
COPY api-gateway/migrations ./migrations/

# Set SQLx to offline mode to avoid needing DATABASE_URL during build
ENV SQLX_OFFLINE=true

# Build the application
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -m -u 1001 api-gateway

# Create app directory
WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/target/release/api-gateway /usr/local/bin/api-gateway

# Copy migrations
COPY --from=builder /app/migrations ./migrations

# Change ownership to app user
RUN chown -R api-gateway:api-gateway /app

# Switch to app user
USER api-gateway

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health > /dev/null 2>&1 || exit 1

# Default command
CMD ["api-gateway"]