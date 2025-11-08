#!/bin/bash
# VPS Deployment Script for Task Distribution System
# For use with existing nginx infrastructure
# Run this on your VPS at 46.62.216.163

set -e  # Exit on error

echo "====================================="
echo "Task Distribution System Deployment"
echo "====================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on VPS
if [ "$USER" != "arner" ]; then
    echo -e "${YELLOW}Warning: This script is designed to run as user 'arner'${NC}"
    echo "Current user: $USER"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Navigate to project directory
echo -e "${GREEN}[1/5] Navigating to project directory...${NC}"
cd /home/arner/tasks

# Step 2: Pull latest changes (if already cloned)
echo -e "${GREEN}[2/5] Pulling latest changes...${NC}"
git pull origin main

# Step 3: Deploy with Docker Compose
echo -e "${GREEN}[3/5] Deploying backend with Docker Compose...${NC}"
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Step 4: Wait for services to be healthy
echo -e "${GREEN}[4/5] Waiting for backend to start...${NC}"
sleep 15

# Check if backend is on the network
if docker network inspect robotics_deployment_proxy_network | grep -q "tasks-backend"; then
    echo "✓ Backend is connected to proxy network"
else
    echo -e "${RED}✗ Backend is not on proxy network${NC}"
    exit 1
fi

# Step 5: Check service health
echo -e "${GREEN}[5/5] Checking backend health...${NC}"
if docker ps | grep -q "tasks-backend"; then
    echo "✓ Backend container is running"
    
    # Try to hit the health endpoint
    sleep 5
    if docker exec tasks-backend wget -q -O- http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✓ Backend health check passed"
    else
        echo -e "${YELLOW}⚠ Backend health check failed (may need more time to start)${NC}"
    fi
else
    echo -e "${RED}✗ Backend container is not running${NC}"
    docker logs tasks-backend --tail 50
    exit 1
fi

echo ""
echo "====================================="
echo -e "${GREEN}Backend Deployment Complete!${NC}"
echo "====================================="
echo ""
echo "⚠️  IMPORTANT: Manual nginx configuration required!"
echo ""
echo "The backend is now running on the proxy network."
echo "To complete deployment, you need to:"
echo ""
echo "1. Copy nginx-integration.conf to your nginx config:"
echo "   sudo cp nginx-integration.conf /etc/nginx/sites-available/tasks"
echo ""
echo "2. Enable the site:"
echo "   sudo ln -sf /etc/nginx/sites-available/tasks /etc/nginx/sites-enabled/tasks"
echo ""
echo "3. Test nginx configuration:"
echo "   sudo nginx -t"
echo ""
echo "4. Reload nginx:"
echo "   sudo systemctl reload nginx"
echo ""
echo "5. Setup SSL (if not already done):"
echo "   sudo certbot --nginx -d tasks.arnereabel.com"
echo ""
echo "To view backend logs:"
echo "  docker logs -f tasks-backend"
echo ""
echo "To restart backend:"
echo "  docker-compose -f docker-compose.prod.yml restart"
echo ""
