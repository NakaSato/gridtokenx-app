#!/bin/bash

echo "Starting Smart Contract Deployment..."

# Environment and path setup
export SOLANA_VERSION=1.18.17
export PATH=/home/solana/.local/share/solana/install/active_release/bin:/home/solana/.cargo/bin:$PATH
export ANCHOR_PROVIDER_URL=http://localhost:8899
export ANCHOR_WALLET=/opt/solana/config/validator-keypair.json

# Deployment configuration
PROGRAMS_DIR="/workspaces/programs"
DEPLOY_STATUS_FILE="/opt/solana/status/deployment.status"
DEPLOY_LOG_FILE="/opt/solana/status/deployment.log"
MAX_DEPLOY_ATTEMPTS=5
DEPLOY_RETRY_DELAY=10

# Create status directory if it doesn't exist
mkdir -p /opt/solana/status

# Function to log with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$DEPLOY_LOG_FILE"
}

# Function to check if validator is ready
wait_for_validator() {
    local attempts=0
    local max_attempts=30
    
    log "Waiting for Solana validator to be ready..."
    
    while [ $attempts -lt $max_attempts ]; do
        if solana cluster-version --url http://localhost:8899 >/dev/null 2>&1; then
            log "Solana validator is ready"
            return 0
        fi
        
        attempts=$((attempts + 1))
        sleep 2
    done
    
    log "ERROR: Solana validator failed to start within timeout"
    return 1
}

# Function to deploy a single program
deploy_program() {
    local program_name="$1"
    local program_path="$PROGRAMS_DIR/$program_name"
    
    if [ ! -d "$program_path" ]; then
        log "WARNING: Program directory not found: $program_path"
        return 1
    fi
    
    log "Deploying program: $program_name"
    
    cd "$program_path" || {
        log "ERROR: Cannot change to program directory: $program_path"
        return 1
    }
    
    # Check if Anchor.toml exists
    if [ ! -f "Anchor.toml" ]; then
        log "WARNING: No Anchor.toml found in $program_path"
        return 1
    fi
    
    # Build the program
    log "Building $program_name..."
    if ! anchor build 2>&1 | tee -a "$DEPLOY_LOG_FILE"; then
        log "ERROR: Failed to build $program_name"
        return 1
    fi
    
    # Deploy the program
    log "Deploying $program_name..."
    if ! anchor deploy 2>&1 | tee -a "$DEPLOY_LOG_FILE"; then
        log "ERROR: Failed to deploy $program_name"
        return 1
    fi
    
    log "Successfully deployed $program_name"
    return 0
}

# Function to deploy all programs
deploy_all_programs() {
    log "Starting deployment of all programs..."
    
    # Define program deployment order (dependencies first)
    local programs=("registry" "energy-token" "governance" "oracle" "trading")
    local deployed_programs=()
    local failed_programs=()
    
    for program in "${programs[@]}"; do
        if deploy_program "$program"; then
            deployed_programs+=("$program")
        else
            failed_programs+=("$program")
        fi
    done
    
    # Report deployment results
    log "Deployment Summary:"
    log "Successfully deployed (${#deployed_programs[@]}): ${deployed_programs[*]}"
    if [ ${#failed_programs[@]} -gt 0 ]; then
        log "Failed to deploy (${#failed_programs[@]}): ${failed_programs[*]}"
        return 1
    fi
    
    log "All programs deployed successfully"
    return 0
}

# Function to initialize PoA governance
initialize_poa_governance() {
    log "Initializing PoA governance..."
    
    # Switch to workspace root for PoA initialization
    cd /workspaces/p2p || {
        log "ERROR: Cannot change to workspace root"
        return 1
    }
    
    # Check if initialization script exists
    if [ -f "scripts/initialize-poa.sh" ]; then
        log "Running PoA initialization script..."
        if bash scripts/initialize-poa.sh 2>&1 | tee -a "$DEPLOY_LOG_FILE"; then
            log "PoA governance initialized successfully"
            return 0
        else
            log "WARNING: PoA initialization script failed"
            return 1
        fi
    else
        log "WARNING: PoA initialization script not found"
        # Create a basic PoA setup if script doesn't exist
        log "Setting up basic PoA configuration..."
        
        # This would include creating university authority account,
        # initializing governance program, etc.
        # For now, we'll just log that manual setup is needed
        log "Manual PoA setup required - check deployment documentation"
        return 0
    fi
}

# Function to airdrop SOL to key accounts
setup_test_accounts() {
    log "Setting up test accounts with SOL..."
    
    local accounts=(
        "/opt/solana/config/validator-keypair.json"
        "/workspaces/p2p/validator-keys/engineering-validator-keypair.json"
        "/workspaces/p2p/validator-keys/engineering-stake-keypair.json"
    )
    
    for account in "${accounts[@]}"; do
        if [ -f "$account" ]; then
            local pubkey
            pubkey=$(solana-keygen pubkey "$account" 2>/dev/null)
            if [ $? -eq 0 ]; then
                log "Airdropping SOL to account: $pubkey"
                solana airdrop 1000 "$pubkey" --url http://localhost:8899 2>&1 | tee -a "$DEPLOY_LOG_FILE"
            fi
        fi
    done
}

# Main deployment function
main() {
    log "=== Smart Contract Deployment Started ==="
    
    # Check if deployment should be skipped
    if [ "${SKIP_DEPLOYMENT:-false}" = "true" ]; then
        log "Deployment skipped (SKIP_DEPLOYMENT=true)"
        echo "SKIPPED" > "$DEPLOY_STATUS_FILE"
        return 0
    fi
    
    # Check if already deployed
    if [ -f "$DEPLOY_STATUS_FILE" ] && [ "$(cat "$DEPLOY_STATUS_FILE")" = "SUCCESS" ]; then
        log "Programs already deployed successfully"
        return 0
    fi
    
    # Mark deployment as in progress
    echo "IN_PROGRESS" > "$DEPLOY_STATUS_FILE"
    
    # Wait for validator to be ready
    if ! wait_for_validator; then
        echo "FAILED" > "$DEPLOY_STATUS_FILE"
        return 1
    fi
    
    # Setup test accounts
    setup_test_accounts
    
    # Deploy all programs with retry logic
    local attempt=1
    while [ $attempt -le $MAX_DEPLOY_ATTEMPTS ]; do
        log "Deployment attempt $attempt of $MAX_DEPLOY_ATTEMPTS"
        
        if deploy_all_programs; then
            log "All programs deployed successfully on attempt $attempt"
            
            # Initialize PoA governance
            initialize_poa_governance
            
            # Mark deployment as successful
            echo "SUCCESS" > "$DEPLOY_STATUS_FILE"
            log "=== Smart Contract Deployment Completed Successfully ==="
            return 0
        fi
        
        log "Deployment attempt $attempt failed"
        if [ $attempt -lt $MAX_DEPLOY_ATTEMPTS ]; then
            log "Retrying in $DEPLOY_RETRY_DELAY seconds..."
            sleep $DEPLOY_RETRY_DELAY
        fi
        
        attempt=$((attempt + 1))
    done
    
    log "ERROR: All deployment attempts failed"
    echo "FAILED" > "$DEPLOY_STATUS_FILE"
    log "=== Smart Contract Deployment Failed ==="
    return 1
}

# Execute main function
main "$@"