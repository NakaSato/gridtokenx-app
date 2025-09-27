#!/bin/bash

echo "Starting Enhanced Anchor Development Environment with Smart Contract Deployment..."

# Source environment
export SOLANA_VERSION=1.18.17
export PATH=/home/solana/.local/share/solana/install/active_release/bin:/home/solana/.cargo/bin:$PATH
export ANCHOR_PROVIDER_URL=http://localhost:8899
export ANCHOR_WALLET=/opt/solana/config/validator-keypair.json

# Deployment configuration
export DEPLOY_STATUS_FILE="/opt/solana/status/deployment.status"
export DEPLOY_LOG_FILE="/opt/solana/status/deployment.log"

# Create status directory
mkdir -p /opt/solana/status

# Function to log with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$DEPLOY_LOG_FILE"
}

# Verify installations
log "Verifying installations..."
log "Solana version: $(solana --version 2>/dev/null || echo 'Not found')"
log "Anchor version: $(anchor --version 2>/dev/null || echo 'Not found')"
log "Rust version: $(rustc --version 2>/dev/null || echo 'Not found')"
log "Node version: $(node --version 2>/dev/null || echo 'Not found')"

# Create directories for validator if needed
mkdir -p /opt/solana/config /opt/solana/ledger

# Function to start validator
start_validator() {
    log "Starting Solana Test Validator..."
    
    # Generate keypair if it doesn't exist
    if [ ! -f /opt/solana/config/validator-keypair.json ]; then
        log "Generating validator keypair..."
        if ! timeout 10 solana-keygen new --no-bip39-passphrase --outfile /opt/solana/config/validator-keypair.json 2>/dev/null; then
            log "Failed to generate keypair due to emulation issues"
            return 1
        fi
    fi

    # Start the validator
    log "Starting validator..."
    solana-test-validator \
        --ledger /opt/solana/ledger \
        --rpc-port 8899 \
        --bind-address 0.0.0.0 \
        --gossip-port 8001 \
        --gossip-host 0.0.0.0 \
        --dynamic-port-range 8002-8020 \
        --log \
        --reset &
    
    local validator_pid=$!
    log "Validator started with PID: $validator_pid"
    
    # Wait for validator to be ready
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if solana cluster-version --url http://localhost:8899 >/dev/null 2>&1; then
            log "Validator is ready and responding"
            return 0
        fi
        
        # Check if validator process is still running
        if ! kill -0 $validator_pid 2>/dev/null; then
            log "ERROR: Validator process died"
            return 1
        fi
        
        attempts=$((attempts + 1))
        sleep 2
    done
    
    log "ERROR: Validator failed to start within timeout"
    return 1
}

# Main execution flow
main() {
    log "=== Enhanced Anchor Development Environment Starting ==="
    
    # Check if we should start the validator
    if [ "${START_VALIDATOR:-true}" = "true" ]; then
        if start_validator; then
            log "Validator started successfully"
            
            # Start smart contract deployment in background if enabled
            if [ "${SKIP_DEPLOYMENT:-false}" != "true" ]; then
                log "Starting smart contract deployment..."
                /usr/local/bin/deploy-contracts.sh &
                local deploy_pid=$!
                log "Deployment started with PID: $deploy_pid"
            else
                log "Smart contract deployment skipped (SKIP_DEPLOYMENT=true)"
                echo "SKIPPED" > "$DEPLOY_STATUS_FILE"
            fi
            
            log "=== Environment Ready ==="
            log "Validator RPC: http://localhost:8899"
            log "Validator WebSocket: ws://localhost:8900"
            log "Health check: /usr/local/bin/check-deployment.sh"
            log "Deployment status: $DEPLOY_STATUS_FILE"
            log "Deployment logs: $DEPLOY_LOG_FILE"
            
        else
            log "Failed to start validator, switching to development mode"
            export START_VALIDATOR=false
        fi
    fi

    # Development mode (validator failed or disabled)
    if [ "${START_VALIDATOR:-true}" != "true" ]; then
        log "Running in development mode"
        log "Available tools:"
        log "   - anchor: $(anchor --version 2>/dev/null)"
        log "   - rust: $(rustc --version 2>/dev/null)"  
        log "   - node: $(node --version 2>/dev/null)"
        log ""
        log "Note: Solana CLI may have emulation issues on ARM64 Mac"
        log "Consider using Solana Playground or native installation for validator"
        log ""
        log "Container running in development mode"
        log "Access with: docker exec -it p2p-anchor-dev bash"
        
        echo "DEV_MODE" > "$DEPLOY_STATUS_FILE"
    fi
    
    # Keep container running
    while true; do
        sleep 3600
    done
}

# Execute main function
main "$@"