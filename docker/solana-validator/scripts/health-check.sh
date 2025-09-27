#!/bin/bash
set -euo pipefail

# GridTokenX Health Check Script
# Comprehensive health check for Solana validator and deployed programs

DEPLOY_PATH="/opt/solana/deploy"
LOG_PATH="/opt/solana/logs"

# Health check functions
check_validator_health() {
    # Check if validator is running and responding
    if ! solana cluster-version >/dev/null 2>&1; then
        return 1
    fi
    
    # Check validator health endpoint
    if command -v curl >/dev/null 2>&1; then
        if ! curl -s -f http://127.0.0.1:8899/health >/dev/null 2>&1; then
            return 1
        fi
    fi
    
    return 0
}

check_rpc_health() {
    # Test basic RPC functionality
    local slot_info
    slot_info=$(solana slot --commitment finalized 2>/dev/null) || return 1
    
    # Ensure we're getting reasonable slot numbers (not stuck)
    if [[ $slot_info -lt 10 ]]; then
        return 1
    fi
    
    return 0
}

check_account_balance() {
    # Verify faucet has sufficient balance
    local balance
    balance=$(solana balance --commitment finalized 2>/dev/null | grep -oE '[0-9]+(\.[0-9]+)?' | head -1) || return 1
    
    # Ensure minimum balance (100 SOL)
    if (( $(echo "$balance < 100" | bc -l) )); then
        return 1
    fi
    
    return 0
}

check_deployed_programs() {
    # Check if deployment status file exists
    if [[ ! -f "$DEPLOY_PATH/deployed-programs.env" ]]; then
        return 1
    fi
    
    # Source deployment info
    # shellcheck source=/dev/null
    source "$DEPLOY_PATH/deployed-programs.env"
    
    # Check deployment status
    if [[ "${DEPLOYMENT_STATUS:-}" != "success" ]]; then
        return 1
    fi
    
    return 0
}

# Main health check
main() {
    local health_status=0
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "GridTokenX Solana Validator Health Check - $timestamp"
    echo "============================================================"
    
    # Validator basic health
    if check_validator_health; then
        echo "✓ Validator: Running"
    else
        echo "✗ Validator: Not responding"
        health_status=1
    fi
    
    # RPC health
    if check_rpc_health; then
        echo "✓ RPC: Healthy"
    else
        echo "✗ RPC: Unhealthy"
        health_status=1
    fi
    
    # Account balance
    if check_account_balance; then
        local balance
        balance=$(solana balance --commitment finalized 2>/dev/null || echo "unknown")
        echo "✓ Faucet Balance: $balance SOL"
    else
        echo "✗ Faucet Balance: Insufficient"
        health_status=1
    fi
    
    # Program deployment status
    if check_deployed_programs; then
        echo "✓ Programs: Deployed"
    else
        echo "✗ Programs: Not deployed or incomplete"
        health_status=1
    fi
    
    # Additional system info
    echo ""
    echo "System Information:"
    echo "- Current Slot: $(solana slot --commitment finalized 2>/dev/null || echo 'unknown')"
    echo "- Epoch: $(solana epoch-info --commitment finalized 2>/dev/null | grep -o 'Epoch: [0-9]*' | cut -d' ' -f2 || echo 'unknown')"
    echo "- Transaction Count: $(solana transaction-count --commitment finalized 2>/dev/null || echo 'unknown')"
    
    # Log health status
    if [[ $health_status -eq 0 ]]; then
        echo "Overall Status: HEALTHY" | tee -a "$LOG_PATH/health.log"
    else
        echo "Overall Status: UNHEALTHY" | tee -a "$LOG_PATH/health.log"
    fi
    
    exit $health_status
}

# Ensure log directory exists
mkdir -p "$LOG_PATH"

# Run health check
main "$@"