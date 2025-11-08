#!/bin/bash
# VPS Deployment Script for Task Distribution System
# Run this on your VPS at 46.62.216.163

set -e  # Exit on error

echo "====================================="
echo "Task Distribution System Deployment"
echo "====================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Step 1: Clone or update repository
echo -e "${GREEN}[1/7] Cloning/updating repository...${NC}"
cd /home/arner
if [ -d "tasks" ]; then
    echo "Repository exists, pulling latest changes..."
    cd tasks
    git pull origin main
else
    echo "Cloning repository..."
    git clone https://github.com/arnereabel/tasks.git
    cd tasks
fi

# Step 2: Configure nginx for subdomain
echo -e "${GREEN}[2/7] Configuring nginx for tasks.arnereabel.com...${NC}"
sudo cp nginx-subdomain.conf /etc/nginx/sites-available/tasks
sudo ln -sf /etc/nginx/sites-available/tasks /etc/nginx/sites-enabled/tasks
sudo nginx -t

# Step 3: Deploy with Docker Compose
echo -e "${GREEN}[3/7] Deploying with Docker Compose...${NC}"
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Step 4: Wait for services to be healthy
echo -e "${GREEN}[4/7] Waiting for services to start...${NC}"
sleep 10

# Step 5: Check service health
echo -e "${GREEN}[5/7] Checking service health...${NC}"
if docker ps | grep -q "tasks-backend"; then
    echo "✓ Backend container is running"
else
    echo "✗ Backend container is not running"
    docker logs tasks-backend --tail 50
    exit 1
fi

if docker ps | grep -q "tasks-frontend"; then
    echo "✓ Frontend container is running"
else
    echo "✗ Frontend container is not running"
    docker logs tasks-frontend --tail 50
    exit 1
fi

# Step 6: Reload nginx
echo -e "${GREEN}[6/7] Reloading nginx...${NC}"
sudo systemctl reload nginx

# Step 7: Setup SSL with certbot
echo -e "${GREEN}[7/7] Setting up SSL certificate...${NC}"
if [ ! -f "/etc/letsencrypt/live/tasks.arnereabel.com/fullchain.pem" ]; then
    echo "Installing SSL certificate..."
    sudo certbot --nginx -d tasks.arnereabel.com --non-interactive --agree-tos -m your-email@example.com
else
    echo "SSL certificate already exists, renewing if needed..."
    sudo certbot renew --quiet
fi

echo ""
echo "====================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "====================================="
echo ""
echo "Your application is now running at:"
echo "  HTTP:  http://tasks.arnereabel.com"
echo "  HTTPS: https://tasks.arnereabel.com"
echo ""
echo "To view logs:"
echo "  Backend:  docker logs -f tasks-backend"
echo "  Frontend: docker logs -f tasks-frontend"
echo ""
echo "To restart services:"
echo "  docker-compose -f docker-compose.prod.yml restart"
echo ""
