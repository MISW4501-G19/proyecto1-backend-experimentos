#!/bin/bash

# Inventarios Server Deployment Script
# Run this script on the Inventarios server

set -e

SERVER_NAME="inventarios"
COMPOSE_FILE="docker-compose.staging-inventarios.yml"
NETWORK_NAME="staging-network"

echo "Deploying Inventarios service to staging..."

# Check if network exists
if ! docker network ls | grep -q "$NETWORK_NAME"; then
    echo "Network $NETWORK_NAME not found. Please run setup-network.sh first"
    exit 1
fi

# Build and deploy
echo "Building Inventarios service..."
docker-compose -f $COMPOSE_FILE build --no-cache

echo "Starting Inventarios service..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for service to be healthy
echo "Waiting for Inventarios service to be healthy..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -f http://localhost:4001/health > /dev/null 2>&1; then
        echo "Inventarios service is healthy!"
        break
    fi
    echo "Waiting for Inventarios service... ($timeout seconds remaining)"
    sleep 5
    timeout=$((timeout-5))
done

if [ $timeout -le 0 ]; then
    echo "Inventarios service failed to start within 60 seconds"
    docker-compose -f $COMPOSE_FILE logs
    exit 1
fi

# Show service status
echo "Inventarios service status:"
docker-compose -f $COMPOSE_FILE ps

echo "Inventarios deployment complete!"
echo "Service available at: http://$(hostname -I | awk '{print $1}'):4001"
