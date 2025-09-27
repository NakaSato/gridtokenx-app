# Multi-stage build for optimized contract deployer container
# Build stage
FROM --platform=linux/amd64 ubuntu:22.04 AS builder

# Install only essential build dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    wget \
    bzip2 \
    pkg-config \
    libssl-dev \
    libudev-dev \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create build user
RUN useradd --create-home -s /bin/bash builder
USER builder
WORKDIR /home/builder

# Install Rust (minimal, no docs)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
    --default-toolchain stable \
    --profile minimal \
    --no-modify-path
ENV PATH="/home/builder/.cargo/bin:${PATH}"

# Install Solana CLI with architecture detection
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "amd64" ]; then \
        SOLANA_ARCH="x86_64-unknown-linux-gnu"; \
    elif [ "$ARCH" = "arm64" ]; then \
        SOLANA_ARCH="aarch64-unknown-linux-gnu"; \
    else \
        echo "Unsupported architecture: $ARCH" && exit 1; \
    fi && \
    curl -sSfL "https://github.com/solana-labs/solana/releases/download/v1.18.17/solana-release-$SOLANA_ARCH.tar.bz2" -o solana.tar.bz2 && \
    tar -xjf solana.tar.bz2 && \
    mkdir -p solana-install && \
    cp -r solana-release/* solana-install/ && \
    rm -rf solana.tar.bz2 solana-release

# Install Node.js (runtime minimal)
USER root
RUN apt-get update && apt-get install -y nodejs npm --no-install-recommends && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean
USER builder

# Install Anchor CLI (minimal build)
RUN cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked --force --profile release
# Clean up cargo cache and build artifacts
RUN rm -rf ~/.cargo/registry ~/.cargo/git ~/.rustup/toolchains/*/share

# Runtime stage
FROM --platform=linux/amd64 ubuntu:22.04 AS runtime

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libudev1 \
    nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && useradd --create-home -s /bin/bash deployer

# Copy binaries from builder
COPY --from=builder /home/builder/.cargo/bin/anchor /usr/local/bin/
COPY --from=builder /home/builder/solana-install/bin/* /usr/local/bin/

# Create required directories
USER root
RUN mkdir -p /opt/deployer/workspace /opt/deployer/artifacts /opt/deployer/logs /opt/deployer/config && \
    chown -R deployer:deployer /opt/deployer

# Copy deployment scripts
COPY deploy-all-contracts.sh /usr/local/bin/deploy-all-contracts.sh
COPY build-contracts.sh /usr/local/bin/build-contracts.sh
COPY verify-deployment.sh /usr/local/bin/verify-deployment.sh
COPY wait-for-validator.sh /usr/local/bin/wait-for-validator.sh
COPY setup-poa.sh /usr/local/bin/setup-poa.sh
COPY health-monitor.sh /usr/local/bin/health-monitor.sh
RUN chmod +x /usr/local/bin/*.sh

USER deployer
WORKDIR /opt/deployer

# Health check
HEALTHCHECK --interval=60s --timeout=30s --start-period=60s --retries=3 \
    CMD /usr/local/bin/health-monitor.sh || exit 1

CMD ["/bin/bash", "-c", "while true; do sleep 30; done"]