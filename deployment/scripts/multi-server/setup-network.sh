#!/bin/bash

# Multi-Server Staging Network Setup Script
# This script creates the shared network for inter-server communication

set -e

NETWORK_NAME="staging-network"
NETWORK_DRIVER="bridge"

echo "Setting up multi-server staging network..."

# Check if network already exists
if docker network ls | grep -q "$NETWORK_NAME"; then
    echo "Network $NETWORK_NAME already exists"
else
    echo "Creating network $NETWORK_NAME..."
    docker network create \
        --driver $NETWORK_DRIVER \
        --subnet=172.20.0.0/16 \
        --ip-range=172.20.240.0/20 \
        $NETWORK_NAME
    echo "Network $NETWORK_NAME created successfully"
fi

# List network details
echo "Network details:"
docker network inspect $NETWORK_NAME --format '{{.Name}}: {{.Driver}} - {{.IPAM.Config}}'

echo "Multi-server network setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy services to each server using the respective compose files"
echo "2. Update service URLs in environment files with actual server IPs"
echo "3. Test inter-service communication"
