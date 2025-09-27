#!/bin/sh

# Health check script for frontend container
# This script checks if the nginx server is responding

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "Nginx is not running"
    exit 1
fi

# Check if the health endpoint responds
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "Frontend is healthy"
    exit 0
else
    echo "Frontend health check failed"
    exit 1
fi
