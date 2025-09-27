#!/bin/bash
# Build script for API Gateway Docker images
# Usage: ./build.sh [development|production]

set -e

# Default to production build
BUILD_TYPE=${1:-production}
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)

echo "Building API Gateway Docker image..."
echo "Build type: $BUILD_TYPE"
echo "Project root: $PROJECT_ROOT"

# Check if SQLx cache exists
if [[ ! -d "$PROJECT_ROOT/api-gateway/.sqlx" ]]; then
    echo "Warning: SQLx query cache (.sqlx/) not found."
    echo "If you encounter compilation errors, run:"
    echo "  cd api-gateway && cargo sqlx prepare"
    echo ""
fi

cd "$PROJECT_ROOT"

if [[ "$BUILD_TYPE" == "development" ]]; then
    echo "Building development image..."
    docker build \
        -f docker/api-gateway/Dockerfile.dev \
        -t p2p-api-gateway:dev \
        .
    echo "Development image built: p2p-api-gateway:dev"
elif [[ "$BUILD_TYPE" == "production" ]]; then
    echo "Building production image..."
    docker build \
        -f docker/api-gateway/Dockerfile \
        -t p2p-api-gateway:latest \
        .
    echo "Production image built: p2p-api-gateway:latest"
else
    echo "Error: Invalid build type '$BUILD_TYPE'. Use 'development' or 'production'."
    exit 1
fi

echo "Build completed successfully!"
echo ""
echo "To run the container:"
if [[ "$BUILD_TYPE" == "development" ]]; then
    echo "  docker run -p 8080:8080 -v \$(pwd)/api-gateway:/app/api-gateway p2p-api-gateway:dev"
else
    echo "  docker run -p 8080:8080 p2p-api-gateway:latest"
fi