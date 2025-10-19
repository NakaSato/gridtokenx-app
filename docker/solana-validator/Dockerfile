# Simplified Solana validator container using pre-built binaries
# Uses the official Solana release builds from GitHub
ARG SOLANA_VERSION=1.18.26

FROM ubuntu:22.04

ARG SOLANA_VERSION

# Install minimal dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    bzip2 \
    jq \
    libssl3 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create solana user
RUN useradd --create-home --shell /bin/bash --user-group solana

# Download and extract Solana binaries from official GitHub releases
# Using curl instead of wget for better SSL handling and retry logic
RUN mkdir -p /opt/solana/bin && \
    cd /tmp && \
    echo "Downloading Solana v${SOLANA_VERSION}..." && \
    curl -L --retry 5 --retry-delay 2 --connect-timeout 30 \
      -o solana-release.tar.bz2 \
      "https://github.com/solana-labs/solana/releases/download/v${SOLANA_VERSION}/solana-release-x86_64-unknown-linux-gnu.tar.bz2" && \
    echo "Extracting..." && \
    tar -xjf solana-release.tar.bz2 -C /tmp && \
    mv /tmp/solana-release/bin/* /opt/solana/bin/ && \
    rm -rf /tmp/solana-release* && \
    chmod +x /opt/solana/bin/* && \
    echo "Verifying installation..." && \
    /opt/solana/bin/solana --version || (echo "Installation failed"; exit 1)

# Create required directories
RUN mkdir -p \
    /opt/solana/ledger \
    /opt/solana/config \
    /opt/solana/logs \
    && chown -R solana:solana /opt/solana

# Add Solana to PATH and create symlinks
RUN ln -s /opt/solana/bin/solana /usr/local/bin/solana && \
    ln -s /opt/solana/bin/solana-validator /usr/local/bin/solana-validator && \
    ln -s /opt/solana/bin/solana-keygen /usr/local/bin/solana-keygen && \
    ln -s /opt/solana/bin/solana-test-validator /usr/local/bin/solana-test-validator && \
    ln -s /opt/solana/bin/solana-faucet /usr/local/bin/solana-faucet

# Switch to solana user and set working directory
USER solana
WORKDIR /opt/solana

# Set environment variables
ENV PATH="/opt/solana/bin:${PATH}" \
    RUST_LOG=solana=info \
    SOLANA_METRICS_CONFIG="" \
    SOLANA_CONFIG_HOME=/opt/solana/config \
    SOLANA_LEDGER_PATH=/opt/solana/ledger

# Expose Solana validator ports
EXPOSE 8899/tcp 8900/tcp 8001/tcp 8003/udp 8004/udp

# Health check
HEALTHCHECK --interval=30s --timeout=15s --start-period=120s --retries=3 \
    CMD /opt/solana/bin/solana cluster-version || exit 1

# Run Solana test validator
CMD ["/opt/solana/bin/solana-test-validator", \
     "--ledger", "/opt/solana/ledger", \
     "--rpc-port", "8899", \
     "--ws-port", "8900", \
     "--faucet-sol", "1000", \
     "--reset", \
     "--quiet"]

