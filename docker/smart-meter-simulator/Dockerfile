# Enhanced Smart Meter Simulator for P2P Energy Trading
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for enhanced features
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p /app/data /app/data/analytics /app/schema

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Create non-root user with proper permissions
RUN useradd --create-home --shell /bin/bash --uid 1000 simulator && \
    chown -R simulator:simulator /app

USER simulator

# Health check for enhanced simulator
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import psycopg2, kafka, pandas; print('Dependencies OK')" || exit 1

# Expose metrics port
EXPOSE 9090

# Default command - run enhanced simulator
CMD ["python", "enhanced_simulator.py"]
