#!/bin/bash

# Simple validator health check
set -e

VALIDATOR_URL="${SOLANA_RPC_URL:-http://solana-validator:8899}"
MAX_ATTEMPTS=30

log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

log "Waiting for validator at $VALIDATOR_URL..."

for i in $(seq 1 $MAX_ATTEMPTS); do
    log "Checking validator ($i/$MAX_ATTEMPTS)..."
    
    if solana cluster-version --url "$VALIDATOR_URL" >/dev/null 2>&1; then
        log "Validator is ready!"
        exit 0
    fi
    
    [ $i -lt $MAX_ATTEMPTS ] && sleep 5
done

log "ERROR: Validator not ready after $((MAX_ATTEMPTS * 5)) seconds"
exit 1