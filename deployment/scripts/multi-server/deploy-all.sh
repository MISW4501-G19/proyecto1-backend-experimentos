#!/bin/bash

# Multi-Server Staging Deployment Script
# This script coordinates deployment across all servers

set -e

echo "Multi-Server Staging Deployment"
echo "=================================="

# Configuration
GATEWAY_SERVER="your-gateway-server-ip"
INVENTARIOS_SERVER="your-inventarios-server-ip"
ORDENES_SERVER="your-ordenes-server-ip"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run command on remote server
run_remote() {
    local server=$1
    local command=$2
    echo -e "${YELLOW} Running on $server: $command${NC}"
    ssh $server "$command"
}

# Function to copy files to remote server
copy_files() {
    local server=$1
    local files=$2
    echo -e "${YELLOW} Copying files to $server${NC}"
    scp -r $files $server:~/microservices-staging/
}

echo " Deployment Plan:"
echo "1. Setup network on all servers"
echo "2. Deploy Inventarios service"
echo "3. Deploy Ordenes service"
echo "4. Deploy Gateway service"
echo "5. Test inter-service communication"
echo ""

read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 1
fi

# Step 1: Setup network on all servers
echo -e "${GREEN} Step 1: Setting up network on all servers${NC}"
run_remote $GATEWAY_SERVER "cd ~/microservices-staging && chmod +x deployment/scripts/multi-server/setup-network.sh && ./deployment/scripts/multi-server/setup-network.sh"
run_remote $INVENTARIOS_SERVER "cd ~/microservices-staging && chmod +x deployment/scripts/multi-server/setup-network.sh && ./deployment/scripts/multi-server/setup-network.sh"
run_remote $ORDENES_SERVER "cd ~/microservices-staging && chmod +x deployment/scripts/multi-server/setup-network.sh && ./deployment/scripts/multi-server/setup-network.sh"

# Step 2: Deploy Inventarios
echo -e "${GREEN} Step 2: Deploying Inventarios service${NC}"
run_remote $INVENTARIOS_SERVER "cd ~/microservices-staging && chmod +x deployment/scripts/multi-server/deploy-inventarios.sh && ./deployment/scripts/multi-server/deploy-inventarios.sh"

# Step 3: Deploy Ordenes
echo -e "${GREEN} Step 3: Deploying Ordenes service${NC}"
run_remote $ORDENES_SERVER "cd ~/microservices-staging && chmod +x deployment/scripts/multi-server/deploy-ordenes.sh && ./deployment/scripts/multi-server/deploy-ordenes.sh"

# Step 4: Deploy Gateway
echo -e "${GREEN} Step 4: Deploying Gateway service${NC}"
run_remote $GATEWAY_SERVER "cd ~/microservices-staging && chmod +x deployment/scripts/multi-server/deploy-gateway.sh && ./deployment/scripts/multi-server/deploy-gateway.sh"

# Step 5: Test communication
echo -e "${GREEN} Step 5: Testing inter-service communication${NC}"
echo "Testing Gateway health..."
run_remote $GATEWAY_SERVER "curl -f http://localhost:4000/health"

echo "Testing Inventarios health..."
run_remote $INVENTARIOS_SERVER "curl -f http://localhost:4001/health"

echo "Testing Ordenes health..."
run_remote $ORDENES_SERVER "curl -f http://localhost:4002/health"

echo -e "${GREEN}🎉 Multi-Server Staging Deployment Complete!${NC}"
echo ""
echo "Service URLs:"
echo "Gateway: http://$GATEWAY_SERVER:4000"
echo "Inventarios: http://$INVENTARIOS_SERVER:4001"
echo "Ordenes: http://$ORDENES_SERVER:4002"
echo ""
echo "To check service status:"
echo "ssh $GATEWAY_SERVER 'docker-compose -f docker-compose.staging-gateway.yml ps'"
echo "ssh $INVENTARIOS_SERVER 'docker-compose -f docker-compose.staging-inventarios.yml ps'"
echo "ssh $ORDENES_SERVER 'docker-compose -f docker-compose.staging-ordenes.yml ps'"
