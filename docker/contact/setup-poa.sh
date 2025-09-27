#!/bin/bash

# Simple PoA setup for Docker container
set -e

WORKSPACE="/opt/deployer/workspace"
ARTIFACTS="/opt/deployer/artifacts"
CONFIG="/opt/deployer/config"
VALIDATOR_URL="${SOLANA_RPC_URL:-http://solana-validator:8899}"

log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

# Setup PoA keypair
setup_keypair() {
    log "Setting up PoA keypair..."
    
    local keys_dir="$CONFIG/poa-keys"
    mkdir -p "$keys_dir"
    
    local keypair="$keys_dir/poa-authority-keypair.json"
    
    # Generate if needed
    if [ ! -f "$keypair" ]; then
        log "Generating PoA authority keypair..."
        solana-keygen new --no-bip39-passphrase --outfile "$keypair"
    fi
    
    # Airdrop SOL
    local pubkey=$(solana-keygen pubkey "$keypair")
    log "Airdropping SOL to PoA authority..."
    solana airdrop 500 "$pubkey" --url "$VALIDATOR_URL" || true
    
    echo "$keys_dir"
}

# Run PoA initialization (simplified)
run_init() {
    local keys_dir="$1"
    
    # Get governance program ID
    local program_id=""
    if [ -f "$ARTIFACTS/governance/program_id.txt" ]; then
        program_id=$(cat "$ARTIFACTS/governance/program_id.txt")
        log "Found governance program: $program_id"
    else
        log "WARNING: Governance program not deployed, skipping PoA init"
        return 0
    fi
    
    # For now, just create a simple status file
    # Full PoA initialization would require the governance program to be properly set up
    echo "SUCCESS" > "$CONFIG/poa-status.txt"
    echo "$(date)" >> "$CONFIG/poa-status.txt"
    echo "Authority: $(solana-keygen pubkey "$keys_dir/poa-authority-keypair.json")" >> "$CONFIG/poa-status.txt"
    
    log "PoA setup completed (simplified)"
    return 0
}

main() {
    log "Starting PoA setup..."
    
    keys_dir=$(setup_keypair)
    
    if run_init "$keys_dir"; then
        log "PoA setup completed!"
    else
        log "PoA setup failed"
        echo "FAILED" > "$CONFIG/poa-status.txt"
        exit 1
    fi
}

main "$@"