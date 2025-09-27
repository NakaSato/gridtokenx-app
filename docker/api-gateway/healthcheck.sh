#!/bin/bash
# Health check script for API Gateway container

set -e

# Health check URL
HEALTH_URL="http://localhost:8080/health"

# Timeout in seconds
TIMEOUT=5

# Check if the API Gateway is responding
response=$(curl -f -s --max-time $TIMEOUT "$HEALTH_URL" || echo "failed")

if [[ "$response" == "failed" ]]; then
    echo "Health check failed: API Gateway not responding"
    exit 1
fi

# Parse JSON response to check status
status=$(echo "$response" | jq -r '.status' 2>/dev/null || echo "unknown")

if [[ "$status" == "healthy" ]]; then
    echo "Health check passed: API Gateway is healthy"
    exit 0
else
    echo "Health check failed: API Gateway status is $status"
    exit 1
fi