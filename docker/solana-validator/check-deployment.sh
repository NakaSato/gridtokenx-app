#!/bin/bash

# Health check script for Solana validator and smart contract deployment
# This script is used by Docker healthcheck to determine container health

export PATH=/home/solana/.local/share/solana/install/active_release/bin:/home/solana/.cargo/bin:$PATH

DEPLOY_STATUS_FILE="/opt/solana/status/deployment.status"
DEPLOY_LOG_FILE="/opt/solana/status/deployment.log"

# Function to check validator health
check_validator() {
    if solana cluster-version --url http://localhost:8899 >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to check deployment status
check_deployment() {
    # Skip deployment check if deployment is disabled
    if [ "${SKIP_DEPLOYMENT:-false}" = "true" ]; then
        return 0
    fi
    
    # Check if status file exists
    if [ ! -f "$DEPLOY_STATUS_FILE" ]; then
        return 1
    fi
    
    local status
    status=$(cat "$DEPLOY_STATUS_FILE" 2>/dev/null)
    
    case "$status" in
        "SUCCESS")
            return 0
            ;;
        "IN_PROGRESS")
            # Check if deployment has been running too long (30 minutes)
            if [ -f "$DEPLOY_LOG_FILE" ]; then
                local last_modified
                last_modified=$(stat -c %Y "$DEPLOY_LOG_FILE" 2>/dev/null || echo 0)
                local current_time
                current_time=$(date +%s)
                local time_diff=$((current_time - last_modified))
                
                # If no activity for more than 30 minutes, consider it stuck
                if [ $time_diff -gt 1800 ]; then
                    echo "Deployment appears stuck - no activity for $((time_diff / 60)) minutes"
                    return 1
                fi
            fi
            return 0
            ;;
        "FAILED")
            return 1
            ;;
        "SKIPPED")
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Function to provide detailed health status
get_health_status() {
    local validator_status="UNKNOWN"
    local deployment_status="UNKNOWN"
    
    # Check validator
    if check_validator; then
        validator_status="HEALTHY"
    else
        validator_status="UNHEALTHY"
    fi
    
    # Check deployment
    if [ "${SKIP_DEPLOYMENT:-false}" = "true" ]; then
        deployment_status="SKIPPED"
    elif [ -f "$DEPLOY_STATUS_FILE" ]; then
        deployment_status=$(cat "$DEPLOY_STATUS_FILE" 2>/dev/null)
    else
        deployment_status="NOT_STARTED"
    fi
    
    echo "Validator: $validator_status, Deployment: $deployment_status"
    
    # Return success if validator is healthy and deployment is in acceptable state
    if [ "$validator_status" = "HEALTHY" ]; then
        case "$deployment_status" in
            "SUCCESS"|"SKIPPED"|"IN_PROGRESS")
                return 0
                ;;
            *)
                return 1
                ;;
        esac
    else
        return 1
    fi
}

# Main health check
main() {
    # For verbose output, set HEALTH_CHECK_VERBOSE=true
    if [ "${HEALTH_CHECK_VERBOSE:-false}" = "true" ]; then
        echo "=== Solana Validator and Deployment Health Check ==="
        get_health_status
    else
        # Silent check for Docker healthcheck
        check_validator && check_deployment
    fi
}

# Execute main function
main "$@"