#!/bin/bash

# Simple deployment verification
set -e

ARTIFACTS="/opt/deployer/artifacts"
VALIDATOR_URL="${SOLANA_RPC_URL:-http://solana-validator:8899}"

log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

# Check if program is deployed
verify_program() {
    local program="$1"
    local program_id_file="$ARTIFACTS/$program/program_id.txt"
    
    [ ! -f "$program_id_file" ] && return 1
    
    local program_id=$(cat "$program_id_file")
    solana account "$program_id" --url "$VALIDATOR_URL" >/dev/null 2>&1
}

main() {
    case "${1:-check}" in
        "check")
            # Quick health check for Docker
            if curl -s "$VALIDATOR_URL" >/dev/null && [ -d "$ARTIFACTS" ]; then
                exit 0
            else
                exit 1
            fi
            ;;
        "detailed")
            log "Verifying deployment..."
            
            # Check validator
            if ! curl -s "$VALIDATOR_URL" >/dev/null; then
                log "ERROR: Validator not accessible"
                exit 1
            fi
            
            # Check programs
            for program in registry energy-token governance oracle trading; do
                if verify_program "$program"; then
                    log "✓ $program deployed"
                else
                    log "✗ $program not deployed"
                fi
            done
            ;;
        *)
            echo "Usage: $0 [check|detailed]"
            exit 1
            ;;
    esac
}

main "$@"