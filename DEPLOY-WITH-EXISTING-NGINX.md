# Deployment Guide: Integrating with Existing Nginx

This guide explains how to deploy the Task Distribution System alongside your existing nginx infrastructure.

## 🎯 Overview

This deployment approach:
- ✅ Works with your existing nginx on port 80/443
- ✅ Deploys only the backend container (no nginx container)
- ✅ Uses the existing `robotics_deployment_proxy_network`
- ✅ Serves frontend files directly through your nginx
- ✅ Proxies API requests to the backend container

## 📋 Prerequisites

From your VPS, you've confirmed:
- ✅ Docker is installed and running
- ✅ Nginx is running on port 80
- ✅ Network `robotics_deployment_proxy_network` exists
- ✅ You have sudo access

## 🚀 Deployment Steps

### Step 1: Clone the Repository

```bash
cd ~
git clone https://github.com/arnereabel/tasks.git
cd tasks
```

### Step 2: Make Deployment Script Executable

```bash
chmod +x deploy-vps.sh
```

### Step 3: Run Deployment Script

This will deploy only the backend container:

```bash
./deploy-vps.sh
```

**What this does:**
- Pulls latest code from GitHub
- Builds the backend Docker image
- Starts backend on the proxy network
- Verifies backend health
- Provides next steps for nginx configuration

### Step 4: Configure Nginx

The deployment script will output instructions, but here they are for reference:

#### 4a. Copy nginx configuration

```bash
sudo cp nginx-integration.conf /etc/nginx/sites-available/tasks
```

#### 4b. Enable the site

```bash
sudo ln -sf /etc/nginx/sites-available/tasks /etc/nginx/sites-enabled/tasks
```

#### 4c. Test nginx configuration

```bash
sudo nginx -t
```

If successful, you should see:
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

#### 4d. Reload nginx

```bash
sudo systemctl reload nginx
```

### Step 5: Setup SSL Certificate

If you haven't set up SSL for `tasks.arnereabel.com` yet:

```bash
sudo certbot --nginx -d tasks.arnereabel.com
```

Follow the prompts. Certbot will:
- Validate domain ownership
- Install SSL certificate
- Automatically update nginx config for HTTPS

If you already have a wildcard certificate or other SSL setup, adjust the paths in `/etc/nginx/sites-available/tasks` accordingly.

### Step 6: Verify Deployment

#### Check backend is running:
```bash
docker ps | grep tasks-backend
```

You should see:
```
tasks-backend   Up X minutes   0.0.0.0:3001->3001/tcp
```

#### Check backend health:
```bash
docker exec tasks-backend wget -q -O- http://localhost:3001/api/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

#### Check nginx is serving the site:
```bash
curl -I http://tasks.arnereabel.com
```

Should return `HTTP/1.1 301` (redirect to HTTPS)

```bash
curl -I https://tasks.arnereabel.com
```

Should return `HTTP/2 200`

### Step 7: Test the Application

Visit: **https://tasks.arnereabel.com**

You should see the Task Distribution System interface.

## 🔧 Architecture

```
Internet
    ↓
Your Nginx (port 80/443)
    ├─→ tasks.arnereabel.com/ → /home/arne/tasks/*.html (frontend files)
    ├─→ tasks.arnereabel.com/api/ → tasks-backend:3001 (backend API)
    ├─→ tasks.arnereabel.com/socket.io/ → tasks-backend:3001 (WebSocket)
    ├─→ tasks.arnereabel.com/uploads/ → /home/arne/tasks/backend/uploads/
    └─→ [your other sites] → [other containers/services]
    
Docker Network: robotics_deployment_proxy_network
    ├─→ tasks-backend (Node.js API)
    └─→ [your other containers]
```

## 📁 File Locations

- **Frontend files**: `/home/arne/tasks/*.html`, `*.js`, `*.css`
- **Backend container**: `tasks-backend` (on proxy network)
- **Database**: `/home/arne/tasks/backend/data/tasks.db`
- **Uploads**: `/home/arne/tasks/backend/data/uploads/`
- **Nginx config**: `/etc/nginx/sites-available/tasks`
- **SSL certs**: `/etc/letsencrypt/live/tasks.arnereabel.com/`

## 🔄 Management Commands

### View Backend Logs
```bash
docker logs -f tasks-backend
```

### Restart Backend
```bash
cd ~/tasks
docker-compose -f docker-compose.prod.yml restart
```

### Update to Latest Version
```bash
cd ~/tasks
git pull origin main
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
sudo systemctl reload nginx
```

### Stop Backend
```bash
cd ~/tasks
docker-compose -f docker-compose.prod.yml down
```

### Check Nginx Status
```bash
sudo systemctl status nginx
```

### Reload Nginx (after config changes)
```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 🐛 Troubleshooting

### Backend Not Starting

Check logs:
```bash
docker logs tasks-backend
```

Common issues:
- Database file permissions
- Network not found (ensure `robotics_deployment_proxy_network` exists)

### 502 Bad Gateway

This means nginx can't reach the backend.

Check:
1. Backend is running: `docker ps | grep tasks-backend`
2. Backend is on network: `docker network inspect robotics_deployment_proxy_network | grep tasks-backend`
3. Nginx config is correct: `sudo nginx -t`

### Frontend Files Not Loading

Check:
1. Files exist: `ls -la /home/arne/tasks/`
2. Nginx has permission: `sudo -u www-data ls /home/arne/tasks/`
3. Nginx config root path is correct

### SSL Certificate Issues

Renew certificate:
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### WebSocket Connection Fails

Check nginx config has proper WebSocket headers:
```bash
grep -A5 "socket.io" /etc/nginx/sites-available/tasks
```

Should include:
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

## 🔒 Security Notes

- The backend is only accessible through nginx (not exposed to internet directly)
- SSL/TLS is handled by nginx
- Files are served with proper MIME types
- CORS is configured to only allow requests from `tasks.arnereabel.com`

## 📊 Monitoring

### Check Application Health
```bash
curl http://tasks-backend:3001/api/health
```

### Check Disk Space
```bash
df -h /home/arne/tasks/backend/data
```

### Check Docker Resources
```bash
docker stats tasks-backend
```

## 🔄 Backup & Restore

### Backup Database
```bash
cp ~/tasks/backend/data/tasks.db ~/tasks/backend/data/tasks.db.backup-$(date +%Y%m%d)
```

### Backup Uploads
```bash
tar -czf ~/uploads-backup-$(date +%Y%m%d).tar.gz ~/tasks/backend/uploads/
```

### Restore Database
```bash
cp ~/tasks/backend/data/tasks.db.backup-YYYYMMDD ~/tasks/backend/data/tasks.db
docker-compose -f ~/tasks/docker-compose.prod.yml restart
```

## 📞 Support

If you encounter issues:
1. Check the logs: `docker logs tasks-backend`
2. Verify nginx config: `sudo nginx -t`
3. Check network connectivity: `docker network inspect robotics_deployment_proxy_network`
4. Review this guide for common solutions

---

**Deployment Date**: 2025-01-08  
**Version**: 1.0 (Integrated with existing nginx)
