# Use multi-stage builds for smaller final image size
# Stage 1: Build Environment
FROM python:3.12-slim as builder

# Set build-time metadata
ARG BUILD_VERSION="1.0.0"
ARG BUILD_DATE
ARG VCS_REF
LABEL maintainer="meter Team" \
      version="${BUILD_VERSION}" \
      description="UTCC University IEEE 2030.5 Campus Network Simulator" \
      build-date="${BUILD_DATE}" \
      vcs-ref="${VCS_REF}"

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install UV (faster Python package manager)
RUN pip install --no-cache-dir uv

# Set working directory
WORKDIR /app


# Copy all application source (including config, code, README, etc.) to builder
COPY . .

# Create virtual environment and install dependencies
RUN uv venv /app/.venv && \
    . /app/.venv/bin/activate && \
    uv sync --frozen

# Stage 2: Runtime Environment
FROM python:3.12-slim as runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    curl \
    tini \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user for security
RUN groupadd -r meter && useradd -r -g meter -s /bin/bash meter

# Set working directory
WORKDIR /app

# Copy Python virtual environment and application code from builder stage
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app /app
RUN chown -R meter:meter /app

# Create necessary directories with proper permissions
RUN mkdir -p logs certs/ca certs/meters data && \
    chown -R meter:meter /app

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONIOENCODING=utf-8 \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    UV_SYSTEM_PYTHON=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:4040/health || exit 1

# Switch to non-root user
USER meter

# Expose ports for HTTP, HTTPS, and gRPC/other
EXPOSE 4040 8443 8444

# Use tini as init system
ENTRYPOINT ["tini", "--"]

# Default command - can be overridden
CMD ["python", "simulator.py"]