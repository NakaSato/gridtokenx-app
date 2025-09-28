# Simplified Solana Validator Dockerfile - Uses Pre-built Binaries
FROM ubuntu:24.04 AS runtime

ARG SOLANA_VERSION=1.18.17

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    libudev1 \
    curl \
    wget \
    bzip2 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create solana user
RUN useradd --create-home --shell /bin/bash --user-group solana

# Download and install Solana binaries directly
RUN mkdir -p /tmp/solana && cd /tmp/solana && \
    # Try direct download from GitHub releases (more reliable)
    wget -O solana-release.tar.bz2 "https://github.com/solana-labs/solana/releases/download/v${SOLANA_VERSION}/solana-release-x86_64-unknown-linux-gnu.tar.bz2" && \
    tar -xjf solana-release.tar.bz2 && \
    cp solana-release/bin/solana-test-validator /usr/local/bin/ && \
    cp solana-release/bin/solana-keygen /usr/local/bin/ && \
    cp solana-release/bin/solana /usr/local/bin/ && \
    chmod +x /usr/local/bin/solana* && \
    cd / && rm -rf /tmp/solana

# Create required directories
RUN mkdir -p \
    /opt/solana/ledger \
    /opt/solana/config \
    /opt/solana/programs \
    /opt/solana/deploy \
    /opt/solana/logs \
    /opt/solana/status \
    && chown -R solana:solana /opt/solana

# Copy scripts
COPY --chown=solana:solana scripts/ /opt/solana/scripts/
RUN chmod +x /opt/solana/scripts/*.sh && \
    ln -sf /opt/solana/scripts/start-validator.sh /usr/local/bin/start-validator && \
    ln -sf /opt/solana/scripts/deploy-contracts.sh /usr/local/bin/deploy-contracts && \
    ln -sf /opt/solana/scripts/health-check.sh /usr/local/bin/health-check

# Switch to solana user
USER solana
WORKDIR /opt/solana

# Environment variables
ENV RUST_LOG=solana=info \
    SOLANA_METRICS_CONFIG="" \
    SOLANA_CONFIG_HOME=/opt/solana/config

# Expose ports
EXPOSE 8899/tcp 8900/tcp 8001/tcp 8003/udp 8004/udp

# Health check
HEALTHCHECK --interval=30s --timeout=15s --start-period=180s --retries=3 \
    CMD /usr/local/bin/health-check || exit 1

# Default command
CMD ["/usr/local/bin/start-validator"]