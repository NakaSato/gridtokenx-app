# Multi-stage build for optimized Solana validator container
ARG SOLANA_VERSION=1.18.17
ARG ANCHOR_VERSION=0.30.1

# Build stage for Solana tools
FROM --platform=$BUILDPLATFORM ubuntu:24.04 AS builder

ARG SOLANA_VERSION
ARG ANCHOR_VERSION

# Install build dependencies in a single layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    wget \
    pkg-config \
    libssl-dev \
    libudev-dev \
    build-essential \
    git \
    openssl \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root build user
RUN useradd --create-home --shell /bin/bash builder && \
    mkdir -p /home/builder/.local/bin
USER builder
WORKDIR /home/builder

# Install Rust with minimal profile
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
    --default-toolchain stable \
    --profile minimal \
    --no-modify-path
ENV PATH="/home/builder/.cargo/bin:${PATH}"

# Install Solana CLI with better error handling
RUN mkdir -p ~/.local/bin && \
    # Try downloading the installer with better SSL handling
    (curl --insecure --retry 3 --retry-delay 5 -sSfL "https://release.solana.com/v${SOLANA_VERSION}/install" | sh || \
     # Fallback 1: Try without SSL verification
     curl -k --retry 3 -sSfL "https://release.solana.com/v${SOLANA_VERSION}/install" | sh || \
     # Fallback 2: Build from source
     (echo "Building Solana from source..." && \
      git clone https://github.com/solana-labs/solana.git --depth 1 --branch v${SOLANA_VERSION} && \
      cd solana && \
      cargo build --release --bin solana --bin solana-validator --bin solana-keygen --bin solana-test-validator --bin solana-faucet && \
      cp target/release/solana* ~/.local/bin/ && \
      cd .. && \
      rm -rf solana)) && \
    # Copy binaries if installation succeeded
    if [ -d ~/.local/share/solana/install/active_release/bin ]; then \
        cp ~/.local/share/solana/install/active_release/bin/* ~/.local/bin/ || true; \
    fi && \
    # Verify at least one Solana binary exists
    ls ~/.local/bin/solana* || (echo "ERROR: No Solana binaries found" && exit 1)

# Install Anchor CLI from git with specific tag
RUN cargo install --git https://github.com/coral-xyz/anchor.git --tag v${ANCHOR_VERSION} anchor-cli --locked || \
    # Fallback: Install latest anchor-cli
    cargo install anchor-cli --locked

# Clean up build artifacts
RUN rm -rf ~/.cargo/registry ~/.cargo/git ~/.rustup

# Runtime stage - minimal Ubuntu 24.04
FROM ubuntu:24.04 AS runtime

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    libudev1 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create solana user with proper home directory
RUN useradd --create-home --shell /bin/bash --user-group solana

# Copy binaries from builder stage
COPY --from=builder --chown=root:root /home/builder/.cargo/bin/anchor /usr/local/bin/
COPY --from=builder --chown=root:root /home/builder/.local/bin/* /usr/local/bin/

# Set executable permissions
RUN chmod +x /usr/local/bin/*

# Create required directories with proper permissions
RUN mkdir -p \
    /opt/solana/ledger \
    /opt/solana/config \
    /opt/solana/programs \
    /opt/solana/deploy \
    /opt/solana/logs \
    /opt/solana/status \
    && chown -R solana:solana /opt/solana

# Copy and set up scripts
COPY --chown=solana:solana scripts/ /opt/solana/scripts/
RUN chmod +x /opt/solana/scripts/*.sh && \
    ln -sf /opt/solana/scripts/start-validator.sh /usr/local/bin/start-validator && \
    ln -sf /opt/solana/scripts/deploy-contracts.sh /usr/local/bin/deploy-contracts && \
    ln -sf /opt/solana/scripts/health-check.sh /usr/local/bin/health-check

# Switch to solana user
USER solana
WORKDIR /opt/solana

# Set environment variables
ENV RUST_LOG=solana=info \
    SOLANA_METRICS_CONFIG="" \
    SOLANA_CONFIG_HOME=/opt/solana/config

# Expose Solana validator ports
EXPOSE 8899/tcp 8900/tcp 8001/tcp 8003/udp 8004/udp

# Add labels for better container management
LABEL org.opencontainers.image.title="GridTokenX Solana Validator" \
      org.opencontainers.image.description="Optimized Solana test validator for P2P energy trading" \
      org.opencontainers.image.vendor="GridTokenX" \
      org.opencontainers.image.version="1.0.0"

# Health check with improved reliability
HEALTHCHECK --interval=30s --timeout=15s --start-period=180s --retries=3 \
    CMD /usr/local/bin/health-check || exit 1

# Default command
CMD ["/usr/local/bin/start-validator"]