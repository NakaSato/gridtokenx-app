#!/bin/bash

# GridTokenX AMI (Advanced Metering Infrastructure) Simulator
# IEEE 2030.5-2018 Smart Energy Profile 2.0 Implementation
# Connects to API Gateway for centralized AMI management

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ami-gridtokenx"
CAMPUS_NAME="UTCC University"
BUILD_VERSION="3.0.0"
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")

# Default API Gateway URL
API_GATEWAY_URL="${API_GATEWAY_URL:-https://api-gateway.gridtokenx.local:8443}"
POLLING_INTERVAL="${POLLING_INTERVAL:-15}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║        GridTokenX AMI Simulator - IEEE 2030.5               ║"
    echo "║        Advanced Metering Infrastructure                     ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Python 3.9+
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is not installed. Please install Python 3.9+"
        exit 1
    fi

    python_version=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    python_major=$(echo $python_version | cut -d. -f1)
    python_minor=$(echo $python_version | cut -d. -f2)
    
    if [ "$python_major" -lt 3 ] || ([ "$python_major" -eq 3 ] && [ "$python_minor" -lt 9 ]); then
        log_error "Python 3.9+ is required. Current version: $python_version"
        exit 1
    fi

    # Check if certificates exist
    if [ ! -d "certs/meters" ]; then
        log_warning "Certificates not found. Generating UTCC campus certificates..."
        python3 generate_campus_certificates.py
    fi

    # Check API Gateway connectivity
    log_info "Checking API Gateway connectivity at ${API_GATEWAY_URL}..."
    if curl -k -f -s "${API_GATEWAY_URL}/dcap" > /dev/null 2>&1; then
        log_success "API Gateway is reachable"
    else
        log_warning "API Gateway is not reachable at ${API_GATEWAY_URL}"
        log_warning "Make sure the API Gateway is running or set API_GATEWAY_URL environment variable"
    fi

    log_success "Prerequisites check completed"
}

setup_environment() {
    log_info "Setting up AMI simulator environment..."

    # Create necessary directories
    mkdir -p logs data/ami config/ami

    # Set environment variables
    export BUILD_VERSION BUILD_DATE VCS_REF
    export PYTHONPATH="${PWD}:${PYTHONPATH:-}"

    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# AMI Simulator Environment Configuration
PROJECT_NAME=${PROJECT_NAME}
API_GATEWAY_URL=${API_GATEWAY_URL}
POLLING_INTERVAL=${POLLING_INTERVAL}
BUILD_VERSION=${BUILD_VERSION}
BUILD_DATE=${BUILD_DATE}
VCS_REF=${VCS_REF}

# IEEE 2030.5 Protocol Settings
IEEE2030_5_PORT=8444
TLS_VERSION=1.2
CERTIFICATE_AUTH=true
MUTUAL_TLS=true

# AMI Configuration
AMI_NETWORK_ID=UTCC_CAMPUS_001
AMI_PROTOCOL=IEEE2030.5
AMI_VERSION=2018
SEP_VERSION=2.0

# Campus Configuration
CAMPUS_NAME=${CAMPUS_NAME}
TOTAL_METERS=25
METER_PREFIX=AMI_METER_UTCC_
EOF
        log_success "Environment file created"
    fi

    # Load environment
    set -a
    source .env
    set +a
}

install_dependencies() {
    log_info "Using existing Python environment with uv..."
    
    # Check if uv is available
    if command -v uv > /dev/null 2>&1; then
        log_info "uv package manager detected, using existing environment"
        # uv should handle dependencies automatically
    else
        log_warning "uv not found, attempting to use system Python"
        
        # Try using python3 -m pip if available
        if python3 -m pip --version > /dev/null 2>&1; then
            log_info "Installing dependencies with system pip..."
            python3 -m pip install --user --quiet \
                aiohttp>=3.8.0 \
                cryptography>=41.0.0 \
                python-dotenv>=1.0.0 \
                numpy>=2.3.0 \
                faker>=37.6.0 2>/dev/null || log_warning "Some dependencies may not be available"
        else
            log_warning "pip not available, proceeding with existing environment"
        fi
    fi
    
    log_success "Dependencies check completed"
}

generate_ami_config() {
    log_info "Generating AMI configuration..."

    # Create AMI-specific configuration
    cat > config/ami/ami_config.json << EOF
{
  "ami_network": {
    "id": "UTCC_CAMPUS_AMI_001",
    "name": "${CAMPUS_NAME} AMI Network",
    "protocol": "IEEE 2030.5-2018",
    "profile": "Smart Energy Profile 2.0",
    "deployment_date": "${BUILD_DATE}",
    "version": "${BUILD_VERSION}"
  },
  "api_gateway": {
    "url": "${API_GATEWAY_URL}",
    "endpoints": {
      "device_capability": "/dcap",
      "end_device": "/edev",
      "mirror_usage_point": "/mir",
      "meter_reading": "/mr",
      "demand_response": "/dr",
      "der_program": "/der",
      "time": "/tm"
    },
    "authentication": {
      "type": "mutual_tls",
      "tls_version": "1.2",
      "certificate_validation": true
    }
  },
  "communication": {
    "polling_interval": ${POLLING_INTERVAL},
    "retry_attempts": 3,
    "retry_delay": 5,
    "timeout": 30,
    "keepalive": true,
    "compression": "gzip"
  },
  "data_management": {
    "buffer_size": 1000,
    "persistence": true,
    "data_format": "IEEE2030.5_XML",
    "quality_codes": {
      "valid": "0x00",
      "questionable": "0x02",
      "estimated": "0x08",
      "invalid": "0x01"
    }
  },
  "security": {
    "certificate_path": "certs/meters",
    "ca_certificate": "certs/ca.pem",
    "validate_certificates": true,
    "certificate_renewal_days": 30,
    "secure_storage": true
  },
  "meter_capabilities": {
    "metering": true,
    "demand_response": true,
    "distributed_energy_resources": true,
    "prepayment": false,
    "pricing": true,
    "messaging": true,
    "billing": true,
    "load_control": true,
    "flow_reservation": true,
    "power_quality": true
  }
}
EOF

    log_success "AMI configuration generated"
}

start_ami_simulator() {
    log_info "Starting AMI Network Simulator..."

    # Use uv to run if available, otherwise use system python
    if command -v uv > /dev/null 2>&1; then
        log_info "Launching AMI simulator with uv and IEEE 2030.5 protocol..."
        uv run ami_simulator.py \
            --config config/utcc_campus_config.json \
            --gateway "${API_GATEWAY_URL}" \
            --interval "${POLLING_INTERVAL}" \
            2>&1 | tee -a logs/ami_simulator.log &
    else
        log_info "Launching AMI simulator with system Python and IEEE 2030.5 protocol..."
        python3 ami_simulator.py \
            --config config/utcc_campus_config.json \
            --gateway "${API_GATEWAY_URL}" \
            --interval "${POLLING_INTERVAL}" \
            2>&1 | tee -a logs/ami_simulator.log &
    fi

    # Store the process ID
    echo $! > logs/ami_simulator.pid

    # Wait a moment for startup
    sleep 3

    # Check if process is running
    if [ -f "logs/ami_simulator.pid" ]; then
        PID=$(cat logs/ami_simulator.pid)
        if ps -p $PID > /dev/null 2>&1; then
            log_success "AMI simulator started successfully (PID: $PID)"
        else
            log_error "AMI simulator failed to start"
            return 1
        fi
    fi
}

show_status() {
    echo ""
    echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║                   AMI SIMULATOR STATUS                       ║${NC}"
    echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    if [ -f "logs/ami_simulator.pid" ]; then
        PID=$(cat logs/ami_simulator.pid)
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${GREEN}✅ AMI Simulator Status: RUNNING${NC}"
            echo -e "   Process ID: $PID"
        else
            echo -e "${RED}❌ AMI Simulator Status: STOPPED${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  AMI Simulator Status: NOT STARTED${NC}"
    fi

    echo ""
    echo -e "${CYAN}📡 Configuration:${NC}"
    echo "   API Gateway URL: ${API_GATEWAY_URL}"
    echo "   Protocol: IEEE 2030.5-2018 (SEP 2.0)"
    echo "   Authentication: Mutual TLS 1.2"
    echo "   Polling Interval: ${POLLING_INTERVAL} seconds"
    echo "   Total Meters: 25"
    echo ""
    echo -e "${CYAN}🔌 IEEE 2030.5 Endpoints:${NC}"
    echo "   Device Capability: ${API_GATEWAY_URL}/dcap"
    echo "   End Device Registry: ${API_GATEWAY_URL}/edev"
    echo "   Mirror Usage Points: ${API_GATEWAY_URL}/mir"
    echo "   Meter Readings: ${API_GATEWAY_URL}/mr"
    echo "   Demand Response: ${API_GATEWAY_URL}/dr"
    echo ""
    echo -e "${CYAN}📊 Campus Distribution:${NC}"
    echo "   • Academic Buildings: 8 meters"
    echo "   • Residential Buildings: 6 meters"
    echo "   • Administrative Buildings: 4 meters"
    echo "   • Athletic Facilities: 3 meters"
    echo "   • Research Centers: 2 meters"
    echo "   • Support Services: 2 meters"
    echo ""
    echo -e "${CYAN}🔐 Security Features:${NC}"
    echo "   • X.509 Certificate Authentication"
    echo "   • TLS 1.2+ Mutual Authentication"
    echo "   • Certificate-based Device Identity"
    echo "   • Encrypted Communication Channel"
    echo ""
}

show_help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start the AMI simulator"
    echo "  stop        Stop the AMI simulator"
    echo "  restart     Restart the AMI simulator"
    echo "  status      Show AMI simulator status"
    echo "  logs        Show AMI simulator logs"
    echo "  config      Display AMI configuration"
    echo "  test        Test API Gateway connectivity"
    echo "  clean       Clean up logs and temporary files"
    echo "  help        Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  API_GATEWAY_URL    API Gateway URL (default: https://api-gateway.gridtokenx.local:8443)"
    echo "  POLLING_INTERVAL   Meter reading interval in seconds (default: 15)"
    echo ""
}

# Main execution
main() {
    case "${1:-}" in
        "start")
            print_banner
            check_prerequisites
            setup_environment
            install_dependencies
            generate_ami_config
            start_ami_simulator
            show_status
            log_success "AMI Simulator deployment complete!"
            ;;

        "stop")
            log_info "Stopping AMI Simulator..."
            if [ -f "logs/ami_simulator.pid" ]; then
                PID=$(cat logs/ami_simulator.pid)
                if ps -p $PID > /dev/null 2>&1; then
                    kill $PID
                    rm -f logs/ami_simulator.pid
                    log_success "AMI Simulator stopped"
                else
                    log_warning "AMI Simulator was not running"
                    rm -f logs/ami_simulator.pid
                fi
            else
                log_warning "No PID file found"
            fi
            ;;

        "restart")
            $0 stop
            sleep 2
            $0 start
            ;;

        "status")
            show_status
            ;;

        "logs")
            if [ -f "logs/ami_simulator.log" ]; then
                tail -f logs/ami_simulator.log
            else
                log_warning "No log file found"
            fi
            ;;

        "config")
            if [ -f "config/ami/ami_config.json" ]; then
                cat config/ami/ami_config.json | python3 -m json.tool
            else
                log_warning "AMI configuration not found. Run 'start' first."
            fi
            ;;

        "test")
            log_info "Testing API Gateway connectivity..."
            echo "Testing ${API_GATEWAY_URL}/dcap..."
            if curl -k -f -s "${API_GATEWAY_URL}/dcap" > /dev/null 2>&1; then
                log_success "API Gateway is responding"
            else
                log_error "API Gateway is not responding"
            fi
            ;;

        "clean")
            log_warning "Cleaning up AMI simulator files..."
            read -p "Remove logs and temporary files? (y/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rm -rf logs/*.log logs/*.pid
                rm -rf data/ami/*
                log_success "Cleanup completed"
            fi
            ;;

        "help")
            show_help
            ;;

        "")
            print_banner
            show_help
            ;;

        *)
            log_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"
