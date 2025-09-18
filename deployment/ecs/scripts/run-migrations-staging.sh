#!/bin/bash

# Run Database Migrations for Staging
# This script runs migrations as ECS tasks

set -e

# Configuration
AWS_REGION="us-east-1"
ECS_CLUSTER="medysupply-staging"
ACCOUNT_ID="${AWS_ACCOUNT_ID:-YOUR_ACCOUNT_ID}"
SUBNET_IDS="${SUBNET_IDS:-subnet-12345,subnet-67890}"
SECURITY_GROUP_IDS="${SECURITY_GROUP_IDS:-sg-12345}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Running Database Migrations for Staging${NC}"
echo "=============================================="
echo ""

# Check if required environment variables are set
if [ "$ACCOUNT_ID" = "YOUR_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Please set AWS_ACCOUNT_ID environment variable${NC}"
    exit 1
fi

# Update task definition with current account ID
echo -e "${YELLOW}📝 Updating task definitions...${NC}"
sed -i "s/ACCOUNT_ID/$ACCOUNT_ID/g" deployment/ecs/task-definitions/migration-job-staging.json

# Register migration task definition
echo -e "${YELLOW}📋 Registering migration task definition...${NC}"
aws ecs register-task-definition \
    --cli-input-json file://deployment/ecs/task-definitions/migration-job-staging.json

# Run migration task
echo -e "${YELLOW}🔄 Running migration task...${NC}"
TASK_ARN=$(aws ecs run-task \
    --cluster $ECS_CLUSTER \
    --task-definition medysupply-migration-job-staging \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$SECURITY_GROUP_IDS],assignPublicIp=ENABLED}" \
    --query 'tasks[0].taskArn' \
    --output text)

echo "Migration task ARN: $TASK_ARN"

# Wait for migration task to complete
echo -e "${YELLOW}⏳ Waiting for migration task to complete...${NC}"
aws ecs wait tasks-stopped \
    --cluster $ECS_CLUSTER \
    --tasks $TASK_ARN

# Check if migration was successful
echo -e "${YELLOW}🔍 Checking migration results...${NC}"
TASK_DETAILS=$(aws ecs describe-tasks \
    --cluster $ECS_CLUSTER \
    --tasks $TASK_ARN)

# Check inventarios migration
INVENTARIOS_EXIT_CODE=$(echo $TASK_DETAILS | jq -r '.tasks[0].containers[] | select(.name=="inventarios-migration") | .exitCode')
ORDENES_EXIT_CODE=$(echo $TASK_DETAILS | jq -r '.tasks[0].containers[] | select(.name=="ordenes-migration") | .exitCode')

if [ "$INVENTARIOS_EXIT_CODE" != "0" ]; then
    echo -e "${RED}❌ Inventarios migration failed with exit code: $INVENTARIOS_EXIT_CODE${NC}"
    exit 1
fi

if [ "$ORDENES_EXIT_CODE" != "0" ]; then
    echo -e "${RED}❌ Ordenes migration failed with exit code: $ORDENES_EXIT_CODE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database migrations completed successfully!${NC}"
echo ""
echo "📊 Migration Summary:"
echo "- Inventarios: ✅ Success"
echo "- Ordenes: ✅ Success"
echo ""
echo "🔗 Check CloudWatch logs for details:"
echo "- Log Group: /ecs/medysupply-migration-job-staging"
echo "- Task ARN: $TASK_ARN"
