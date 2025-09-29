#!/bin/bash

# Build script for InfluxDB Docker container optimized for AMI simulator engine

set -e

echo "Building InfluxDB container optimized for AMI simulator timestamp data..."

# Build the InfluxDB image
docker build -t gridtokenx/influxdb:ami-optimized ./docker/influxdb

echo "Build complete!"
echo ""
echo "To run the container:"
echo "docker run -d --name influxdb-ami -p 8086:8086 gridtokenx/influxdb:ami-optimized"
echo ""
echo "To run with Docker Compose:"
echo "docker-compose up influxdb"
echo ""
echo "InfluxDB will be available at http://localhost:8086"
echo "Admin User: admin / gridtokenx2025"
echo "Organization: gridtokenx"
echo "Admin Token: gridtokenx-admin-token-2025"