# VPS Quick Start Guide

Follow these exact steps on your VPS to deploy the Task Distribution System.

## 📍 You Are Here

You've SSH'd into your VPS and confirmed:
- ✅ Docker is running
- ✅ Nginx is running on port 80
- ✅ Network `robotics_deployment_proxy_network` exists

## 🚀 Deployment Steps (Copy & Paste)

### 1. Navigate to Home Directory
```bash
cd ~
```

### 2. Clone Repository
```bash
git clone https://github.com/arnereabel/tasks.git
cd tasks
```

### 3. Make Script Executable
```bash
chmod +x deploy-vps.sh
```

### 4. Run Deployment Script
```bash
./deploy-vps.sh
```

**Wait for script to complete** (takes ~2-3 minutes)

### 5. Configure Nginx

#### Copy config file:
```bash
sudo cp nginx-integration.conf /etc/nginx/sites-available/tasks
```

#### Enable the site:
```bash
sudo ln -sf /etc/nginx/sites-available/tasks /etc/nginx/sites-enabled/tasks
```

#### Test nginx config:
```bash
sudo nginx -t
```

Should see: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

#### Reload nginx:
```bash
sudo systemctl reload nginx
```

### 6. Setup SSL Certificate

```bash
sudo certbot --nginx -d tasks.arnereabel.com
```

Follow the prompts. When asked, select option to redirect HTTP to HTTPS.

### 7. Verify Deployment

#### Check backend is running:
```bash
docker ps | grep tasks-backend
```

Should show a running container.

#### Test the site:
Open browser to: **https://tasks.arnereabel.com**

You should see the Task Distribution System!

---

## 🎯 What If Something Goes Wrong?

### Backend not running?
```bash
docker logs tasks-backend
```

### 502 Bad Gateway?
```bash
# Check backend is on network
docker network inspect robotics_deployment_proxy_network | grep tasks-backend

# Check nginx config
sudo nginx -t

# Restart backend
cd ~/tasks
docker-compose -f docker-compose.prod.yml restart
```

### Frontend not loading?
```bash
# Check files exist
ls -la ~/tasks/*.html

# Check nginx error log
sudo tail -f /var/log/nginx/tasks.error.log
```

---

## 📝 Useful Commands

### View backend logs:
```bash
docker logs -f tasks-backend
```

### Restart backend:
```bash
cd ~/tasks
docker-compose -f docker-compose.prod.yml restart
```

### Update to latest version:
```bash
cd ~/tasks
git pull origin main
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📂 File Locations

- **Project**: `/home/arner/tasks/`
- **Database**: `/home/arner/tasks/backend/data/tasks.db`
- **Uploads**: `/home/arner/tasks/backend/uploads/`
- **Nginx Config**: `/etc/nginx/sites-available/tasks`
- **SSL Certs**: `/etc/letsencrypt/live/tasks.arnereabel.com/`

---

**For detailed documentation, see DEPLOY-WITH-EXISTING-NGINX.md**
