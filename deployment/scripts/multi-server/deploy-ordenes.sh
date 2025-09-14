#!/bin/bash

# Ordenes Server Deployment Script
# Run this script on the Ordenes server

set -e

SERVER_NAME="ordenes"
COMPOSE_FILE="docker-compose.staging-ordenes.yml"
NETWORK_NAME="staging-network"

echo "Deploying Ordenes service to staging..."

# Check if network exists
if ! docker network ls | grep -q "$NETWORK_NAME"; then
    echo "Network $NETWORK_NAME not found. Please run setup-network.sh first"
    exit 1
fi

# Build and deploy
echo "Building Ordenes service..."
docker-compose -f $COMPOSE_FILE build --no-cache

echo "Starting Ordenes service..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for service to be healthy
echo "Waiting for Ordenes service to be healthy..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -f http://localhost:4002/health > /dev/null 2>&1; then
        echo "Ordenes service is healthy!"
        break
    fi
    echo "⏳ Waiting for Ordenes service... ($timeout seconds remaining)"
    sleep 5
    timeout=$((timeout-5))
done

if [ $timeout -le 0 ]; then
    echo "Ordenes service failed to start within 60 seconds"
    docker-compose -f $COMPOSE_FILE logs
    exit 1
fi

# Wait for worker to be healthy
echo "Waiting for Ordenes worker to be healthy..."
timeout=60
while [ $timeout -gt 0 ]; do
    if docker exec ordenes-worker-staging pgrep -f "worker.js" > /dev/null 2>&1; then
        echo "Ordenes worker is healthy!"
        break
    fi
    echo "Waiting for Ordenes worker... ($timeout seconds remaining)"
    sleep 5
    timeout=$((timeout-5))
done

if [ $timeout -le 0 ]; then
    echo "Ordenes worker failed to start within 60 seconds"
    docker-compose -f $COMPOSE_FILE logs ordenes-worker
    exit 1
fi

# Show service status
echo "Ordenes service status:"
docker-compose -f $COMPOSE_FILE ps

echo "Ordenes deployment complete!"
echo "Service available at: http://$(hostname -I | awk '{print $1}'):4002"
