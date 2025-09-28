#!/bin/bash

# GridTokenX UTCC University Campus Network - Docker Deployment Script
# IEEE 2030.5-2018 Smart Energy Profile 2.0 - Phase 2 Deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="utcc-gridtokenx"
CAMPUS_NAME="UTCC University"
BUILD_VERSION="2.0.0"
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")

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

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available. Please update Docker to latest version."
        exit 1
    fi
    
    # Check if certificates exist
    if [ ! -d "certs/meters" ]; then
        log_warning "Certificates not found. Generating UTCC campus certificates..."
        python generate_campus_certificates.py
    fi
    
    log_success "Prerequisites check completed"
}

setup_environment() {
    log_info "Setting up environment for ${CAMPUS_NAME}..."
    
    # Create necessary directories
    mkdir -p logs data config/backup
    
    # Set environment variables
    export BUILD_VERSION BUILD_DATE VCS_REF
    export COMPOSE_PROJECT_NAME="${PROJECT_NAME}"
    
    # Generate .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# UTCC University GridTokenX Campus Network Environment
COMPOSE_PROJECT_NAME=${PROJECT_NAME}
DB_PASSWORD=utcc_secure_2024_$(openssl rand -hex 8)
JWT_SECRET=utcc_jwt_secret_$(openssl rand -hex 16)
GRAFANA_PASSWORD=utcc_admin_$(openssl rand -hex 4)
BUILD_VERSION=${BUILD_VERSION}
BUILD_DATE=${BUILD_DATE}
VCS_REF=${VCS_REF}
EOF
        log_success "Environment file created"
    fi
}

build_images() {
    log_info "Setting up ${CAMPUS_NAME} campus network environment..."
    
    # Generate certificates if they don't exist
    if [ ! -d "certs/meters" ] || [ -z "$(ls -A certs/meters 2>/dev/null)" ]; then
        log_info "Generating UTCC campus certificates..."
        python generate_campus_certificates.py
    fi
    
    # Install Python dependencies
    log_info "Installing Python dependencies..."
    if command -v uv > /dev/null 2>&1; then
        uv sync
    else
        pip install -e .
    fi
    
    log_success "Environment setup completed"
}

deploy_services() {
    log_info "Deploying ${CAMPUS_NAME} campus network services..."
    
    # Start smart meter simulator directly with Python
    log_info "Starting UTCC campus smart meter simulator..."
    
    # Check if virtual environment exists
    if [ ! -d ".venv" ]; then
        log_info "Creating Python virtual environment..."
        python3 -m venv .venv
    fi
    
    # Activate virtual environment and install dependencies
    log_info "Installing dependencies..."
    source .venv/bin/activate
    pip install -e .
    
    # Start the campus network deployment
    log_info "Launching 25-meter UTCC campus network..."
    python campus_network_deployment.py --config-file config/utcc_campus_config.json &
    
    # Store the process ID
    echo $! > logs/campus_simulator.pid
    
    log_success "UTCC campus network simulator deployed successfully"
}

verify_deployment() {
    log_info "Verifying ${CAMPUS_NAME} campus network deployment..."
    
    # Check if simulator process is running
    if [ -f "logs/campus_simulator.pid" ]; then
        PID=$(cat logs/campus_simulator.pid)
        if ps -p $PID > /dev/null 2>&1; then
            log_success "Campus simulator process is running (PID: $PID)"
        else
            log_error "Campus simulator process is not running"
            return 1
        fi
    else
        log_warning "Campus simulator PID file not found"
    fi
    
    # Test API endpoints (wait a moment for startup)
    log_info "Testing API endpoints..."
    sleep 5
    
    if curl -f -s http://localhost:8080/health > /dev/null 2>&1; then
        log_success "Smart meter simulator API is responding"
    else
        log_warning "Smart meter simulator API is not responding yet (may still be starting)"
    fi
}

show_deployment_info() {
    echo ""
    echo "============================================"
    echo "   ${CAMPUS_NAME} GridTokenX Campus Network"
    echo "   IEEE 2030.5-2018 Deployment Complete"
    echo "============================================"
    echo ""
    echo "📊 Services Available:"
    echo "   • Smart Meter Simulator: http://localhost:8080"
    echo "   • IEEE 2030.5 Server:    https://localhost:8444"
    echo ""
    echo "🔧 Management Commands:"
    echo "   • View logs:    tail -f logs/campus_simulator.log"
    echo "   • Stop:         kill \$(cat logs/campus_simulator.pid)"
    echo "   • Restart:      ./deploy-utcc-campus.sh restart"
    echo "   • Status:       ps -p \$(cat logs/campus_simulator.pid)"
    echo ""
    echo "📈 Monitoring:"
    echo "   • 25 Smart Meters: AMI_METER_UTCC_001 through AMI_METER_UTCC_025"
    echo "   • TLS Certificates: Generated for all UTCC campus meters"
    echo "   • IEEE 2030.5-2018 Compliance: Smart Energy Profile 2.0"
    echo ""
    echo "🏫 Campus Buildings Covered:"
    echo "   • Engineering Buildings A & B"
    echo "   • Business Administration Building"
    echo "   • Science Building & Library"
    echo "   • Student Center & Administration"
    echo "   • Dormitories A & B"
    echo "   • Cafeteria, Gymnasium, Research Center"
    echo ""
    echo "For detailed logs: tail -f logs/utcc_campus.log"
    echo ""
}

# Main execution
main() {
    log_info "Starting ${CAMPUS_NAME} GridTokenX Campus Network Deployment"
    log_info "IEEE 2030.5-2018 Smart Energy Profile 2.0 - Phase 2"
    
    check_prerequisites
    setup_environment
    build_images
    deploy_services
    verify_deployment
    show_deployment_info
    
    log_success "UTCC University campus network deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    "build")
        build_images
        ;;
    "deploy")
        deploy_services
        ;;
    "stop")
        log_info "Stopping ${CAMPUS_NAME} campus network..."
        if [ -f "logs/campus_simulator.pid" ]; then
            PID=$(cat logs/campus_simulator.pid)
            if ps -p $PID > /dev/null 2>&1; then
                kill $PID
                rm -f logs/campus_simulator.pid
                log_success "Campus simulator stopped"
            else
                log_warning "Campus simulator was not running"
                rm -f logs/campus_simulator.pid
            fi
        else
            log_warning "No PID file found"
        fi
        ;;
    "restart")
        log_info "Restarting ${CAMPUS_NAME} campus network..."
        if [ -f "logs/campus_simulator.pid" ]; then
            PID=$(cat logs/campus_simulator.pid)
            if ps -p $PID > /dev/null 2>&1; then
                kill $PID
            fi
            rm -f logs/campus_simulator.pid
        fi
        sleep 2
        main
        ;;
    "logs")
        if [ -f "logs/campus_simulator.log" ]; then
            tail -f logs/campus_simulator.log
        else
            log_warning "No log file found. Run deployment first."
        fi
        ;;
    "status")
        if [ -f "logs/campus_simulator.pid" ]; then
            PID=$(cat logs/campus_simulator.pid)
            if ps -p $PID > /dev/null 2>&1; then
                echo "✅ Campus simulator is running (PID: $PID)"
                ps -p $PID
            else
                echo "❌ Campus simulator is not running"
                rm -f logs/campus_simulator.pid
            fi
        else
            echo "❌ No campus simulator process found"
        fi
        ;;
    "clean")
        log_warning "This will stop the simulator and clean up process files"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [ -f "logs/campus_simulator.pid" ]; then
                PID=$(cat logs/campus_simulator.pid)
                if ps -p $PID > /dev/null 2>&1; then
                    kill $PID
                fi
                rm -f logs/campus_simulator.pid
            fi
            rm -f logs/campus_simulator.log
            log_success "Cleanup completed"
        fi
        ;;
    "")
        main
        ;;
    *)
        echo "Usage: $0 [stop|restart|logs|status|clean]"
        exit 1
        ;;
esac