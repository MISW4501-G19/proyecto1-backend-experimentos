# Microservices Independent Deployment Guide

This directory contains all the necessary files and configurations for deploying each microservice independently.

## 🏗️ Architecture Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Gateway   │    │ Inventarios │    │   Ordenes   │
│   Service   │    │   Service   │    │   Service   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │                   │                   │
   ┌───▼───┐           ┌───▼───┐           ┌───▼───┐
   │  SQS  │           │  DB   │           │  DB   │
   │ Queue │           │(Postgres)         │(Postgres)
   └───────┘           └───────┘           └───────┘
```

## 📁 Directory Structure

```
deployment/
├── gateway/                 # Gateway service deployment
│   └── Dockerfile
├── inventarios/            # Inventarios service deployment
│   └── Dockerfile
├── ordenes/                # Ordenes service deployment
│   └── Dockerfile
├── kubernetes/             # Kubernetes manifests
│   ├── gateway/
│   ├── inventarios/
│   └── ordenes/
└── shared/
    ├── config/             # Environment configurations
    │   ├── service-discovery.js
    │   ├── gateway.env
    │   ├── inventarios.env
    │   └── ordenes.env
    └── scripts/            # Deployment scripts
        └── deploy.sh
```

## 🚀 Deployment Options

### Option 1: Docker Compose (Development)
```bash
# Deploy all services locally
docker-compose up -d

# Deploy specific service
docker-compose up -d gateway
```

### Option 2: Individual Docker Containers
```bash
# Build and run each service independently
docker build -t gateway:latest -f deployment/gateway/Dockerfile ./gateway/
docker run -d --name gateway -p 4000:4000 --env-file deployment/shared/config/gateway.env gateway:latest
```

### Option 3: Kubernetes
```bash
# Deploy to Kubernetes
kubectl apply -f deployment/kubernetes/gateway/
kubectl apply -f deployment/kubernetes/inventarios/
kubectl apply -f deployment/kubernetes/ordenes/
```

### Option 4: Using Deployment Script
```bash
# Deploy all services
./deployment/shared/scripts/deploy.sh all production deploy

# Deploy specific service
./deployment/shared/scripts/deploy.sh gateway staging deploy

# Build only
./deployment/shared/scripts/deploy.sh inventarios development build
```

## 🔧 Environment Configuration

Each service can be configured independently using environment variables:

### Gateway Service
- `NODE_ENV`: Environment (development/staging/production)
- `PORT`: Service port (default: 4000)
- `INVENTARIOS_URL`: Inventarios service URL
- `ORDENES_URL`: Ordenes service URL
- `SQS_ENDPOINT`: SQS endpoint URL
- `ORDER_CREATION_QUEUE_URL`: SQS queue URL

### Inventarios Service
- `NODE_ENV`: Environment
- `PORT`: Service port (default: 4001)
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password

### Ordenes Service
- `NODE_ENV`: Environment
- `PORT`: Service port (default: 4002)
- `INVENTARIOS_URL`: Inventarios service URL
- `SQS_ENDPOINT`: SQS endpoint URL
- `ORDER_CREATION_QUEUE_URL`: SQS queue URL
- Database configuration (same as Inventarios)

## 🌐 Service Discovery

Services use environment-based configuration to discover each other:

- **Development**: Local URLs (localhost:port)
- **Staging**: Staging environment URLs
- **Production**: Production environment URLs

## 📊 Health Checks

Each service exposes a health check endpoint:
- Gateway: `GET /health`
- Inventarios: `GET /health`
- Ordenes: `GET /health`

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy Microservices
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy Gateway
        run: ./deployment/shared/scripts/deploy.sh gateway production deploy
      - name: Deploy Inventarios
        run: ./deployment/shared/scripts/deploy.sh inventarios production deploy
      - name: Deploy Ordenes
        run: ./deployment/shared/scripts/deploy.sh ordenes production deploy
```

## 🐛 Troubleshooting

### Service Not Starting
1. Check environment variables
2. Verify service dependencies are running
3. Check logs: `docker logs <service-name>`

### Service Discovery Issues
1. Verify service URLs in configuration
2. Check network connectivity
3. Verify DNS resolution

### Database Connection Issues
1. Check database credentials
2. Verify database is accessible
3. Check firewall rules

## 📈 Monitoring

Each service should be monitored for:
- Health status
- Response times
- Error rates
- Resource usage
- Database connections

## 🔒 Security Considerations

1. Use secrets management for sensitive data
2. Implement proper authentication/authorization
3. Use HTTPS in production
4. Regular security updates
5. Network segmentation
