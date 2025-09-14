#!/bin/bash

# Service URL Update Script
# Updates service URLs in environment files with actual server IPs

set -e

# Configuration - Update these with your actual server IPs
GATEWAY_SERVER_IP="192.168.1.10"
INVENTARIOS_SERVER_IP="192.168.1.11"
ORDENES_SERVER_IP="192.168.1.12"

echo "Updating service URLs with actual server IPs..."

# Update Gateway environment file
echo "Updating Gateway environment..."
sed -i.bak "s/inventarios-server/$INVENTARIOS_SERVER_IP/g" .env/staging/gateway.env
sed -i.bak "s/ordenes-server/$ORDENES_SERVER_IP/g" .env/staging/gateway.env

# Update Ordenes environment file
echo "Updating Ordenes environment..."
sed -i.bak "s/inventarios-server/$INVENTARIOS_SERVER_IP/g" .env/staging/ordenes.env

echo "Service URLs updated successfully!"
echo ""
echo "Updated URLs:"
echo "Gateway -> Inventarios: http://$INVENTARIOS_SERVER_IP:4001"
echo "Gateway -> Ordenes: http://$ORDENES_SERVER_IP:4002"
echo "Ordenes -> Inventarios: http://$INVENTARIOS_SERVER_IP:4001"
echo ""
echo "Remember to update these IPs in the deploy-all.sh script as well!"
