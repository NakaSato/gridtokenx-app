#!/bin/bash

# Production Build Script for P2P Energy Trading Frontend

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

# Configuration
IMAGE_NAME="p2p-frontend"
TAG="latest"
DOCKERFILE="docker/frontend/Dockerfile"

print_status "Building production-optimized frontend container..."

# Build the production image
docker build \
    --file "$DOCKERFILE" \
    --tag "$IMAGE_NAME:$TAG" \
    --build-arg NODE_ENV=production \
    --progress=plain \
    .

if [ $? -eq 0 ]; then
    print_success "Frontend production image built successfully!"
    
    # Show image size
    SIZE=$(docker images "$IMAGE_NAME:$TAG" --format "table {{.Size}}" | tail -n 1)
    print_status "Image size: $SIZE"
    
    # Optional: Remove intermediate images to save space
    print_status "Cleaning up intermediate images..."
    docker image prune -f
    
    print_success "Build completed successfully!"
else
    print_error "Build failed!"
    exit 1
fi

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Change to script directory
cd "$(dirname "$0")"

print_status "Building P2P Energy Trading Frontend Docker Images..."

# Check if we're in the right directory
if [ ! -f "../../frontend/package.json" ]; then
    print_error "Frontend directory not found. Please run this script from the docker/frontend directory."
    exit 1
fi

# Build development image
print_status "Building development image..."
if docker build -f Dockerfile.dev -t p2p-frontend:dev ../../frontend; then
    print_success "Development image built successfully"
else
    print_error "Failed to build development image"
    exit 1
fi

# Build production image
print_status "Building production image..."
if docker build -f Dockerfile -t p2p-frontend:latest ../../frontend; then
    print_success "Production image built successfully"
else
    print_error "Failed to build production image"
    exit 1
fi

# Optional: Build with specific tags
if [ "$1" = "--tag" ] && [ -n "$2" ]; then
    print_status "Building images with custom tag: $2"
    
    docker build -f Dockerfile.dev -t p2p-frontend:$2-dev ../../frontend
    docker build -f Dockerfile -t p2p-frontend:$2 ../../frontend
    
    print_success "Images built with custom tag: $2"
fi

# Show built images
print_status "Built images:"
docker images | grep p2p-frontend

print_success "All frontend images built successfully!"

# Usage information
echo ""
print_status "Usage examples:"
echo "  Run development:  docker run -p 3000:3000 p2p-frontend:dev"
echo "  Run production:   docker run -p 80:80 p2p-frontend:latest"
echo "  With compose:     docker-compose up frontend-dev"
echo "  With profiles:    docker-compose --profile development up"
