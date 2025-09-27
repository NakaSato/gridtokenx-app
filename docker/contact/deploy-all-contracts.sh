#!/bin/bash

# Simple deployment script for Solana contracts
set -e

WORKSPACE="/opt/deployer/workspace"
ARTIFACTS="/opt/deployer/artifacts"
VALIDATOR_URL="${SOLANA_RPC_URL:-http://solana-validator:8899}"
KEYPAIR="/opt/deployer/config/deployer-keypair.json"

# Simple logging
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

# Setup deployer account
setup_account() {
    log "Setting up deployer account..."
    
    mkdir -p "$(dirname "$KEYPAIR")"
    
    # Create keypair if needed
    [ ! -f "$KEYPAIR" ] && solana-keygen new --no-bip39-passphrase --outfile "$KEYPAIR"
    
    # Set as default
    solana config set --keypair "$KEYPAIR" --url "$VALIDATOR_URL"
    
    # Airdrop SOL if needed
    local pubkey=$(solana-keygen pubkey "$KEYPAIR")
    local balance=$(solana balance "$pubkey" --url "$VALIDATOR_URL" | awk '{print $1}' || echo "0")
    
    if [ "${balance%.*}" -lt 50 ]; then
        log "Airdropping SOL..."
        solana airdrop 500 "$pubkey" --url "$VALIDATOR_URL"
    fi
}

# Deploy single program
deploy_program() {
    local program="$1"
    log "Deploying $program..."
    
    cd "$WORKSPACE"
    anchor deploy --program-name "$program" --provider.cluster "$VALIDATOR_URL"
    
    # Save program ID
    mkdir -p "$ARTIFACTS/$program"
    anchor keys list | grep "$program" | awk '{print $2}' > "$ARTIFACTS/$program/program_id.txt"
}

# Main deployment
main() {
    log "Starting deployment..."
    
    # Wait for validator
    until solana cluster-version --url "$VALIDATOR_URL" >/dev/null 2>&1; do
        log "Waiting for validator..."
        sleep 5
    done
    
    # Setup
    setup_account
    
    # Build contracts
    log "Building contracts..."
    /usr/local/bin/build-contracts.sh
    
    # Deploy in order
    for program in registry energy-token governance oracle trading; do
        deploy_program "$program"
    done
    
    # Setup PoA
    log "Setting up PoA..."
    /usr/local/bin/setup-poa.sh || log "PoA setup failed (continuing)"
    
    log "Deployment completed!"
    
    # Keep container running
    while true; do sleep 3600; done
}

main "$@"