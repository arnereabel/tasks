#!/bin/bash
# VPS Deployment Script for Task Distribution System
# Option A: Self-contained deployment with built-in NGINX
# Run this on your VPS after fresh clone

set -e  # Exit on error

echo "================================================"
echo "Task Distribution System - Fresh Deployment"
echo "================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}Error: docker-compose.prod.yml not found!${NC}"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Step 1: Check for .env file
echo -e "${GREEN}[1/6] Checking environment configuration...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠ No .env file found. Creating from template...${NC}"
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "✓ Created backend/.env from template"
        echo ""
        echo -e "${YELLOW}IMPORTANT: Edit backend/.env if you want to customize:${NC}"
        echo "  - Database configuration"
        echo "  - Environment (production/development)"
        echo "  - Port settings"
        echo ""
        read -p "Press Enter to continue or Ctrl+C to abort and edit .env..."
    else
        echo -e "${RED}Error: .env.example not found!${NC}"
        exit 1
    fi
else
    echo "✓ .env file found"
fi

# Step 2: Stop and remove old containers
echo -e "${GREEN}[2/6] Cleaning up old containers...${NC}"
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
echo "✓ Old containers removed"

# Step 3: Build fresh images
echo -e "${GREEN}[3/6] Building Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache
echo "✓ Images built successfully"

# Step 4: Start services
echo -e "${GREEN}[4/6] Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d
echo "✓ Services started"

# Step 5: Wait for services to be healthy
echo -e "${GREEN}[5/6] Waiting for services to be ready...${NC}"
echo "This may take 30-60 seconds..."
sleep 20

# Check if containers are running
if docker ps | grep -q "tasks-backend" && docker ps | grep -q "tasks-nginx"; then
    echo "✓ Containers are running"
    
    # Wait a bit more and check health
    sleep 10
    if docker exec tasks-backend wget -q -O- http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✓ Backend health check passed"
    else
        echo -e "${YELLOW}⚠ Backend health check failed (may still be starting)${NC}"
    fi
else
    echo -e "${RED}✗ Containers failed to start${NC}"
    echo "Backend logs:"
    docker logs tasks-backend --tail 50
    exit 1
fi

# Step 6: Display status and next steps
echo ""
echo -e "${GREEN}[6/6] Deployment Status${NC}"
echo "================================================"
docker-compose -f docker-compose.prod.yml ps
echo "================================================"

echo ""
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo ""
echo "Your app is now running at:"
echo "  http://$(hostname -I | awk '{print $1}'):8080"
echo "  (or http://YOUR_VPS_IP:8080)"
echo ""
echo "📋 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  TEST THE APP FIRST:"
echo "   Visit http://YOUR_VPS_IP:8080 in your browser"
echo "   Make sure everything works before adding domain"
echo ""
echo "2️⃣  ADD REVERSE PROXY (for tasks.arnereabel.com):"
echo "   The file 'nginx-reverse-proxy.conf' contains the config."
echo ""
echo "   Quick setup:"
echo "   docker cp nginx-reverse-proxy.conf nginx_web:/etc/nginx/conf.d/tasks.conf"
echo "   docker exec nginx_web nginx -t"
echo "   docker exec nginx_web nginx -s reload"
echo ""
echo "3️⃣  SETUP SSL (after step 2 works):"
echo "   sudo certbot --nginx -d tasks.arnereabel.com"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Useful Commands:"
echo "  View logs:     docker-compose -f docker-compose.prod.yml logs -f"
echo "  Restart:       docker-compose -f docker-compose.prod.yml restart"
echo "  Stop:          docker-compose -f docker-compose.prod.yml down"
echo "  Rebuild:       docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
