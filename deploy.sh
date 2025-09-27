#!/bin/bash

# Docker deployment script for GridTokenX P2P Energy Trading System
# This script prepares and deploys the entire system using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Prerequisites check completed"
}

# Function to prepare environment
prepare_environment() {
    print_status "Preparing deployment environment..."
    
    # Create necessary directories
    mkdir -p validator-keys
    mkdir -p docker/smart-meter-simulator/data
    mkdir -p docker/nginx/ssl
    mkdir -p docker/nginx/conf.d
    
    # Copy environment file if it doesn't exist
    if [ ! -f .env ]; then
        print_warning ".env file not found. Copying from .env.example"
        cp .env.example .env
        print_warning "Please review and update .env file with production values"
    fi
    
    # Build Anchor programs and generate TypeScript clients
    print_status "Building Anchor programs and generating clients..."
    npm run setup || {
        print_error "Failed to build Anchor programs"
        exit 1
    }
    
    print_success "Environment preparation completed"
}

# Function to deploy services
deploy_services() {
    print_status "Deploying services with Docker Compose..."
    
    # Pull latest images
    print_status "Pulling latest Docker images..."
    docker-compose pull
    
    # Build custom images
    print_status "Building custom Docker images..."
    docker-compose build
    
    # Start infrastructure services first
    print_status "Starting infrastructure services..."
    docker-compose up -d postgres redis kafka zookeeper
    
    # Wait for infrastructure services to be healthy
    print_status "Waiting for infrastructure services to be ready..."
    sleep 30
    
    # Start blockchain services
    print_status "Starting blockchain services..."
    docker-compose up -d solana-validator contact
    
    # Wait for blockchain to be ready
    print_status "Waiting for blockchain services to be ready..."
    sleep 60
    
    # Start application services
    print_status "Starting application services..."
    docker-compose up -d api-gateway smart-meter-simulator oracle-simulator
    
    # Start frontend and proxy
    print_status "Starting frontend and proxy services..."
    docker-compose up -d frontend nginx
    
    # Start monitoring services
    print_status "Starting monitoring services..."
    docker-compose up -d prometheus grafana
    
    print_success "All services deployed successfully"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check service health
    print_status "Checking service health..."
    
    local services=("postgres" "redis" "solana-validator" "api-gateway" "frontend")
    local failed_services=()
    
    for service in "${services[@]}"; do
        if docker-compose ps -q "$service" | xargs docker inspect --format '{{.State.Health.Status}}' 2>/dev/null | grep -q "healthy"; then
            print_success "$service is healthy"
        else
            print_warning "$service health check failed or not configured"
            failed_services+=("$service")
        fi
    done
    
    # Check service connectivity
    print_status "Checking service connectivity..."
    
    # Check frontend
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        print_success "Frontend is accessible at http://localhost:3000"
    else
        print_warning "Frontend may not be fully ready yet"
    fi
    
    # Check API Gateway
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health | grep -q "200"; then
        print_success "API Gateway is accessible at http://localhost:8080"
    else
        print_warning "API Gateway may not be fully ready yet"
    fi
    
    # Check Grafana
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200"; then
        print_success "Grafana is accessible at http://localhost:3001"
    else
        print_warning "Grafana may not be fully ready yet"
    fi
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        print_success "Deployment verification completed successfully"
    else
        print_warning "Some services may need more time to become healthy: ${failed_services[*]}"
    fi
}

# Function to display deployment information
show_deployment_info() {
    cat << EOF

${GREEN}================================================================================
GridTokenX P2P Energy Trading System - Deployment Complete
================================================================================${NC}

${BLUE}🌐 Web Services:${NC}
  Frontend:           http://localhost:3000
  API Gateway:        http://localhost:8080
  Grafana Dashboard:  http://localhost:3001 (admin/admin)
  Nginx Proxy:        http://localhost:80

${BLUE}🔗 Blockchain Services:${NC}
  Solana RPC:         http://localhost:8898
  Solana WebSocket:   ws://localhost:8901

${BLUE}📊 Infrastructure Services:${NC}
  PostgreSQL:         localhost:5432 (p2p_user/p2p_password)
  Redis:              localhost:6379
  Kafka:              localhost:9092
  Prometheus:         http://localhost:9090

${BLUE}📋 Useful Commands:${NC}
  View all services:          docker-compose ps
  View service logs:          docker-compose logs -f [service_name]
  Stop all services:          docker-compose down
  Restart a service:          docker-compose restart [service_name]
  View system resources:      docker-compose top

${BLUE}🔧 Configuration:${NC}
  Environment file:           .env
  Docker Compose file:        docker-compose.yml
  
${YELLOW}⚠️  Important Notes:${NC}
  - First startup may take several minutes for all services to become ready
  - Check service logs if you encounter any issues: docker-compose logs -f
  - Blockchain data persists in Docker volumes
  - Update .env file with production secrets before deploying to production

${GREEN}✅ Deployment Complete!${NC}

EOF
}

# Function to handle cleanup
cleanup_on_error() {
    print_error "Deployment failed. Cleaning up..."
    docker-compose down
    exit 1
}

# Main execution
main() {
    echo "
    ╔══════════════════════════════════════════════════════════════╗
    ║                   GridTokenX Deployment                     ║
    ║              P2P Energy Trading System                      ║
    ╚══════════════════════════════════════════════════════════════╝
    "
    
    # Trap errors
    trap cleanup_on_error ERR
    
    # Parse command line arguments
    case "${1:-deploy}" in
        "check")
            check_prerequisites
            ;;
        "prepare")
            check_prerequisites
            prepare_environment
            ;;
        "deploy")
            check_prerequisites
            prepare_environment
            deploy_services
            verify_deployment
            show_deployment_info
            ;;
        "verify")
            verify_deployment
            ;;
        "info")
            show_deployment_info
            ;;
        "stop")
            print_status "Stopping all services..."
            docker-compose down
            print_success "All services stopped"
            ;;
        "clean")
            print_status "Stopping and removing all containers, networks, and volumes..."
            docker-compose down -v --remove-orphans
            docker system prune -f
            print_success "Cleanup completed"
            ;;
        *)
            echo "Usage: $0 {check|prepare|deploy|verify|info|stop|clean}"
            echo ""
            echo "Commands:"
            echo "  check    - Check prerequisites only"
            echo "  prepare  - Prepare environment and build programs"
            echo "  deploy   - Full deployment (default)"
            echo "  verify   - Verify existing deployment"
            echo "  info     - Show deployment information"
            echo "  stop     - Stop all services"
            echo "  clean    - Stop services and clean up all data"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"