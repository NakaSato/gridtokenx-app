# Multi-stage build for optimized Solana validator container
# Build stage for Anchor and Solana tools
FROM --platform=$BUILDPLATFORM ubuntu:22.04 AS builder

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

# Install Node.js (runtime minimal)
USER root
RUN apt-get update && apt-get install -y nodejs npm --no-install-recommends && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean
USER builder

# Build Solana from source for ARM64 compatibility
RUN git clone https://github.com/solana-labs/solana.git --depth 1 --branch v1.18.15 && \
    cd solana && \
    cargo build --release --bin solana --bin solana-validator --bin solana-keygen --bin solana-faucet --bin solana-test-validator && \
    mkdir -p ~/.local/bin && \
    cp target/release/solana target/release/solana-validator target/release/solana-keygen target/release/solana-faucet target/release/solana-test-validator ~/.local/bin/ && \
    cd .. && \
    rm -rf solana

# Install Anchor CLI (minimal build)
RUN cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked --force --profile release
# Clean up cargo cache
RUN rm -rf ~/.cargo/registry ~/.cargo/git

# Runtime stage
FROM ubuntu:22.04 AS runtime

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libudev1 \
    nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && useradd --create-home -s /bin/bash solana

# Copy binaries from builder
COPY --from=builder /home/builder/.cargo/bin/anchor /usr/local/bin/
COPY --from=builder /home/builder/.local/bin/* /usr/local/bin/

# Create required directories
USER root
RUN mkdir -p /opt/solana/ledger /opt/solana/config /opt/solana/programs /opt/solana/deploy /opt/solana/status && \
    chown -R solana:solana /opt/solana

# Copy scripts
WORKDIR /opt/solana
COPY start-validator.sh /usr/local/bin/start-validator.sh
COPY deploy-contracts.sh /usr/local/bin/deploy-contracts.sh
COPY check-deployment.sh /usr/local/bin/check-deployment.sh
RUN chmod +x /usr/local/bin/start-validator.sh /usr/local/bin/deploy-contracts.sh /usr/local/bin/check-deployment.sh

USER solana

# Expose ports
EXPOSE 8899 8900 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
    CMD /usr/local/bin/check-deployment.sh || exit 1

CMD ["/usr/local/bin/start-validator.sh"]