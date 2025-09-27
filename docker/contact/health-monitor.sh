#!/bin/bash

# Simple health monitor
set -e

VALIDATOR_URL="${SOLANA_RPC_URL:-http://solana-validator:8899}"
ARTIFACTS="/opt/deployer/artifacts"

# Check validator health
check_validator() {
    curl -s "$VALIDATOR_URL" >/dev/null 2>&1
}

# Check artifacts exist
check_artifacts() {
    [ -d "$ARTIFACTS" ] && [ "$(ls -A "$ARTIFACTS" 2>/dev/null)" ]
}

# Main health check
main() {
    case "${1:-check}" in
        "check")
            # Docker healthcheck - silent
            if check_validator && check_artifacts; then
                exit 0
            else
                exit 1
            fi
            ;;
        "status")
            echo "Validator: $(check_validator && echo 'OK' || echo 'FAIL')"
            echo "Artifacts: $(check_artifacts && echo 'OK' || echo 'FAIL')"
            ;;
        "detailed")
            echo "=== Health Status ==="
            echo "Validator: $(check_validator && echo 'OK' || echo 'FAIL')"
            echo "Artifacts: $(check_artifacts && echo 'OK' || echo 'FAIL')"
            
            if [ -d "$ARTIFACTS" ]; then
                echo ""
                echo "Deployed programs:"
                for dir in "$ARTIFACTS"/*; do
                    [ -d "$dir" ] && echo "  - $(basename "$dir")"
                done
            fi
            ;;
        *)
            echo "Usage: $0 [check|status|detailed]"
            exit 1
            ;;
    esac
}

main "$@"