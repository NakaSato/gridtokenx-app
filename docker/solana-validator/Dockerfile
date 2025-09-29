# Multi-arch Solana Validator Dockerfile using install script
FROM ubuntu:24.04

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    libudev1 \
    curl \
    wget \
    bzip2 \
    gnupg \
    lsb-release \
    sudo \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create solana user
RUN useradd --create-home --shell /bin/bash --user-group --groups sudo solana && \
    echo 'solana ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Install Solana CLI by downloading the binary directly v2
USER solana
ENV PATH="/home/solana/.local/share/solana/install/active_release/bin:${PATH}"
RUN mkdir -p /home/solana/.local/share/solana/install/active_release/bin
RUN cd /tmp && wget https://github.com/solana-labs/solana/releases/download/v1.18.17/solana-release-x86_64-unknown-linux-gnu.tar.bz2
RUN cd /tmp && tar -xjf solana-release-x86_64-unknown-linux-gnu.tar.bz2
RUN ls -la /tmp/solana-release/bin/
RUN cp /tmp/solana-release/bin/solana* /home/solana/.local/share/solana/install/active_release/bin/
RUN rm -rf /tmp/solana-release*
RUN ls -la /home/solana/.local/share/solana/install/active_release/bin/
RUN solana --version

# Create required directories
USER root
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