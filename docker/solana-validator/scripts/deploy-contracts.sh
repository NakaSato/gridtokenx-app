#!/bin/bash
set -euo pipefail

# GridTokenX Contract Deployment Script
# Deploys all 5 Anchor programs for P2P energy trading

DEPLOY_PATH="/opt/solana/deploy"
PROGRAMS_PATH="/opt/solana/programs"
LOG_PATH="/opt/solana/logs"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_PATH/deploy.log"
}

# Wait for validator to be ready
wait_for_validator() {
    local max_attempts=60
    local attempt=1
    
    log "Waiting for Solana validator to be ready..."
    
    while [[ $attempt -le $max_attempts ]]; do
        if solana cluster-version >/dev/null 2>&1; then
            log "Validator is ready!"
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts: Validator not ready, waiting 5 seconds..."
        sleep 5
        ((attempt++))
    done
    
    log "ERROR: Validator failed to start after $max_attempts attempts"
    return 1
}

# Deploy a single program
deploy_program() {
    local program_name=$1
    local program_path="$PROGRAMS_PATH/${program_name}.so"
    
    if [[ ! -f "$program_path" ]]; then
        log "WARNING: Program file not found: $program_path"
        return 1
    fi
    
    log "Deploying $program_name..."
    
    if solana program deploy "$program_path" --commitment finalized; then
        local program_id
        program_id=$(solana address -k "$program_path" 2>/dev/null || echo "unknown")
        log "Successfully deployed $program_name (Program ID: $program_id)"
        echo "$program_name=$program_id" >> "$DEPLOY_PATH/deployed-programs.env"
        return 0
    else
        log "ERROR: Failed to deploy $program_name"
        return 1
    fi
}

# Main deployment function
main() {
    log "Starting GridTokenX contract deployment..."
    
    # Create deployment directory
    mkdir -p "$DEPLOY_PATH"
    
    # Clear previous deployment log
    > "$DEPLOY_PATH/deployed-programs.env"
    
    # Wait for validator
    if ! wait_for_validator; then
        exit 1
    fi
    
    # Airdrop SOL for deployment fees
    log "Requesting SOL airdrop for deployment..."
    solana airdrop 1000 --commitment finalized || {
        log "WARNING: Airdrop failed, but continuing with deployment..."
    }
    
    # Deploy all programs
    local programs=("registry" "energy_token" "trading" "oracle" "governance")
    local deployed_count=0
    
    for program in "${programs[@]}"; do
        if deploy_program "$program"; then
            ((deployed_count++))
        fi
    done
    
    log "Deployment complete: $deployed_count/${#programs[@]} programs deployed successfully"
    
    if [[ $deployed_count -eq ${#programs[@]} ]]; then
        log "All programs deployed successfully!"
        echo "DEPLOYMENT_STATUS=success" >> "$DEPLOY_PATH/deployed-programs.env"
        return 0
    else
        log "Some programs failed to deploy"
        echo "DEPLOYMENT_STATUS=partial" >> "$DEPLOY_PATH/deployed-programs.env"
        return 1
    fi
}

# Run main function
main "$@"