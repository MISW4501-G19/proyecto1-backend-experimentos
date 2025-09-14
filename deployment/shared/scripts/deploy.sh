#!/bin/bash

# Microservices Deployment Script
# Usage: ./deploy.sh [service] [environment] [action]

set -e

SERVICE=${1:-"all"}
ENVIRONMENT=${2:-"development"}
ACTION=${3:-"deploy"}

echo "🚀 Deploying $SERVICE to $ENVIRONMENT environment with action: $ACTION"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to deploy a service
deploy_service() {
    local service=$1
    local env=$2
    
    echo -e "${YELLOW}📦 Building $service service...${NC}"
    
    # Build Docker image
    docker build -t $service:$env -f deployment/$service/Dockerfile ./$service/
    
    # Tag for registry
    docker tag $service:$env registry.example.com/$service:$env
    
    # Push to registry
    docker push registry.example.com/$service:$env
    
    echo -e "${GREEN}✅ $service service built and pushed successfully${NC}"
}

# Function to deploy to Kubernetes
deploy_k8s() {
    local service=$1
    local env=$2
    
    echo -e "${YELLOW}☸️  Deploying $service to Kubernetes...${NC}"
    
    # Apply Kubernetes manifests
    kubectl apply -f deployment/kubernetes/$service/
    
    # Wait for deployment
    kubectl rollout status deployment/$service-service
    
    echo -e "${GREEN}✅ $service deployed to Kubernetes successfully${NC}"
}

# Main deployment logic
case $ACTION in
    "build")
        if [ "$SERVICE" = "all" ]; then
            deploy_service "gateway" $ENVIRONMENT
            deploy_service "inventarios" $ENVIRONMENT
            deploy_service "ordenes" $ENVIRONMENT
        else
            deploy_service $SERVICE $ENVIRONMENT
        fi
        ;;
    "deploy")
        if [ "$SERVICE" = "all" ]; then
            deploy_k8s "gateway" $ENVIRONMENT
            deploy_k8s "inventarios" $ENVIRONMENT
            deploy_k8s "ordenes" $ENVIRONMENT
        else
            deploy_k8s $SERVICE $ENVIRONMENT
        fi
        ;;
    "rollback")
        echo -e "${YELLOW}🔄 Rolling back $SERVICE...${NC}"
        kubectl rollout undo deployment/$SERVICE-service
        ;;
    *)
        echo -e "${RED}❌ Unknown action: $ACTION${NC}"
        echo "Usage: $0 [service] [environment] [action]"
        echo "Services: gateway, inventarios, ordenes, all"
        echo "Environments: development, staging, production"
        echo "Actions: build, deploy, rollback"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
