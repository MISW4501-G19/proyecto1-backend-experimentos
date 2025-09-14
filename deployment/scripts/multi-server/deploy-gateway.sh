#!/bin/bash

# Gateway Server Deployment Script
# Run this script on the Gateway server

set -e

SERVER_NAME="gateway"
COMPOSE_FILE="docker-compose.staging-gateway.yml"
NETWORK_NAME="staging-network"

echo "Deploying Gateway service to staging..."

# Check if network exists
if ! docker network ls | grep -q "$NETWORK_NAME"; then
    echo "Network $NETWORK_NAME not found. Please run setup-network.sh first"
    exit 1
fi

# Build and deploy
echo "Building Gateway service..."
docker-compose -f $COMPOSE_FILE build --no-cache

echo "Starting Gateway service..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for service to be healthy
echo "Waiting for Gateway service to be healthy..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -f http://localhost:4000/health > /dev/null 2>&1; then
        echo "✅ Gateway service is healthy!"
        break
    fi
    echo "⏳ Waiting for Gateway service... ($timeout seconds remaining)"
    sleep 5
    timeout=$((timeout-5))
done

if [ $timeout -le 0 ]; then
    echo "Gateway service failed to start within 60 seconds"
    docker-compose -f $COMPOSE_FILE logs
    exit 1
fi

# Show service status
echo "Gateway service status:"
docker-compose -f $COMPOSE_FILE ps

echo "Gateway deployment complete!"
echo "Service available at: http://$(hostname -I | awk '{print $1}'):4000"
