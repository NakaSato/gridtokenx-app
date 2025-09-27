#!/bin/bash
set -euo pipefail

# GridTokenX Program Management Script
# Utility script for managing deployed Anchor programs

DEPLOY_PATH="/opt/solana/deploy"
LOG_PATH="/opt/solana/logs"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_PATH/programs.log"
}

# List all deployed programs
list_programs() {
    if [[ ! -f "$DEPLOY_PATH/deployed-programs.env" ]]; then
        log "No deployed programs found"
        return 1
    fi
    
    echo "GridTokenX Deployed Programs:"
    echo "============================="
    
    # shellcheck source=/dev/null
    source "$DEPLOY_PATH/deployed-programs.env"
    
    echo "Registry Program: ${registry:-'Not deployed'}"
    echo "Energy Token Program: ${energy_token:-'Not deployed'}"
    echo "Trading Program: ${trading:-'Not deployed'}"
    echo "Oracle Program: ${oracle:-'Not deployed'}"
    echo "Governance Program: ${governance:-'Not deployed'}"
    echo ""
    echo "Deployment Status: ${DEPLOYMENT_STATUS:-'Unknown'}"
}

# Get program info
get_program_info() {
    local program_id=$1
    
    if [[ -z "$program_id" ]]; then
        echo "Usage: $0 info <program_id>"
        return 1
    fi
    
    log "Getting program info for: $program_id"
    
    echo "Program Information:"
    echo "==================="
    solana program show "$program_id" || {
        log "Failed to get program info for $program_id"
        return 1
    }
}

# Check program accounts
check_accounts() {
    local program_id=$1
    
    if [[ -z "$program_id" ]]; then
        echo "Usage: $0 accounts <program_id>"
        return 1
    fi
    
    log "Checking accounts for program: $program_id"
    
    echo "Program Accounts:"
    echo "================="
    solana account "$program_id" --output json-compact || {
        log "Failed to get account info for $program_id"
        return 1
    }
}

# Show program logs
show_logs() {
    local program_name=${1:-"all"}
    
    echo "GridTokenX Program Logs:"
    echo "======================="
    
    case "$program_name" in
        "all")
            tail -n 50 "$LOG_PATH"/*.log 2>/dev/null || echo "No logs found"
            ;;
        "validator")
            tail -n 50 "$LOG_PATH/validator.log" 2>/dev/null || echo "No validator logs found"
            ;;
        "deploy")
            tail -n 50 "$LOG_PATH/deploy.log" 2>/dev/null || echo "No deployment logs found"
            ;;
        "health")
            tail -n 50 "$LOG_PATH/health.log" 2>/dev/null || echo "No health logs found"
            ;;
        *)
            echo "Available logs: all, validator, deploy, health"
            return 1
            ;;
    esac
}

# Main function
main() {
    local command=${1:-"help"}
    
    case "$command" in
        "list"|"ls")
            list_programs
            ;;
        "info")
            get_program_info "${2:-}"
            ;;
        "accounts")
            check_accounts "${2:-}"
            ;;
        "logs")
            show_logs "${2:-all}"
            ;;
        "help"|*)
            echo "GridTokenX Program Management Tool"
            echo ""
            echo "Usage: $0 <command> [arguments]"
            echo ""
            echo "Commands:"
            echo "  list, ls           - List all deployed programs"
            echo "  info <program_id>  - Get program information"
            echo "  accounts <program_id> - Check program accounts"
            echo "  logs [type]        - Show logs (all, validator, deploy, health)"
            echo "  help               - Show this help message"
            ;;
    esac
}

# Ensure log directory exists
mkdir -p "$LOG_PATH"

# Run command
main "$@"