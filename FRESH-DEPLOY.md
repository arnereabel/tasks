# Fresh Deployment Guide - Option A (Self-Contained)

This guide walks you through deploying the Task Distribution System with a clean, self-contained setup that won't interfere with your existing services.

## 🎯 What You'll Get

- ✅ Self-contained app with its own NGINX
- ✅ No interference with existing nginx_web
- ✅ Easy to test before going live
- ✅ Simple integration with existing NGINX
- ✅ Clean rollback if needed

## 📋 Prerequisites

- VPS with Docker and Docker Compose installed
- Domain `tasks.arnereabel.com` pointing to your VPS
- Existing `nginx_web` container (optional, for domain integration)

## 🚀 Deployment Steps

### Step 1: Clean Slate on VPS

```bash
# SSH to your VPS
ssh arner@46.62.216.163

# Remove old deployment
cd ~
rm -rf tasks

# Clone fresh from GitHub
git clone https://github.com/arnereabel/tasks.git
cd tasks
```

### Step 2: Configure Environment

The deployment script will automatically create `backend/.env` from the template, but you can customize it if needed:

```bash
# Optional: Edit environment variables
nano backend/.env
```

**Default configuration (works out of the box):**
```env
DATABASE_URL=sqlite:data/database.sqlite
NODE_ENV=production
PORT=3001
```

### Step 3: Deploy

```bash
# Make script executable
chmod +x deploy-vps.sh

# Run deployment
./deploy-vps.sh
```

The script will:
1. ✓ Check for .env file (create from template if missing)
2. ✓ Clean up old containers
3. ✓ Build fresh Docker images
4. ✓ Start services (backend + nginx)
5. ✓ Run health checks
6. ✓ Display status and next steps

### Step 4: Test the App

After deployment completes, test the app directly:

```bash
# Get your VPS IP
hostname -I

# Visit in browser:
# http://YOUR_VPS_IP:8080
```

✅ **The app should now be working on port 8080!**

### Step 5: Integrate with Domain (Optional)

Once the app works on port 8080, integrate it with your existing NGINX:

```bash
# Copy reverse proxy config to nginx_web
docker cp nginx-reverse-proxy.conf nginx_web:/etc/nginx/conf.d/tasks.conf

# Test NGINX configuration
docker exec nginx_web nginx -t

# If test passes, reload NGINX
docker exec nginx_web nginx -s reload
```

**Important Note for Linux:** The config uses `host.docker.internal`. On Linux, you may need to use `172.17.0.1` (Docker bridge IP) instead. Edit the config:

```bash
docker exec nginx_web sed -i 's/host.docker.internal/172.17.0.1/g' /etc/nginx/conf.d/tasks.conf
docker exec nginx_web nginx -t
docker exec nginx_web nginx -s reload
```

### Step 6: Setup SSL (Optional)

After domain integration works:

```bash
sudo certbot --nginx -d tasks.arnereabel.com
```

## 🔍 Troubleshooting

### App Not Working on Port 8080

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx
```

### 500 Error After Domain Integration

```bash
# Check nginx_web logs
docker logs nginx_web

# Verify the proxy config was copied
docker exec nginx_web cat /etc/nginx/conf.d/tasks.conf

# On Linux, verify host.docker.internal is accessible or use 172.17.0.1
docker exec nginx_web cat /etc/nginx/conf.d/tasks.conf | grep proxy_pass
```

### Port 8080 Already in Use

Edit `docker-compose.prod.yml` and change the port mapping:

```yaml
nginx:
  ports:
    - "8081:80"  # Use 8081 instead of 8080
```

Then update `nginx-reverse-proxy.conf` to proxy to the new port.

## 📊 Management Commands

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View backend logs only
docker-compose -f docker-compose.prod.yml logs -f backend

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml down

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🔄 Updating the App

```bash
cd ~/tasks
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🗑️ Complete Removal

If you need to completely remove the deployment:

```bash
cd ~/tasks
docker-compose -f docker-compose.prod.yml down -v
cd ~
rm -rf tasks

# Also remove from nginx_web if integrated
docker exec nginx_web rm -f /etc/nginx/conf.d/tasks.conf
docker exec nginx_web nginx -s reload
```

## 🎉 Success Indicators

- ✅ `docker-compose -f docker-compose.prod.yml ps` shows all containers as "healthy"
- ✅ `http://YOUR_VPS_IP:8080` loads the app
- ✅ You can create jobs and tasks
- ✅ `https://tasks.arnereabel.com` works (after domain integration)
- ✅ No 500 errors in browser

## 📞 Still Having Issues?

Check these files for detailed information:
- `VPS-QUICKSTART.md` - Quick reference guide
- `DEPLOYMENT.md` - Full deployment documentation
- `NGINX-DOCKER-SETUP.md` - NGINX setup details

Common issues:
1. **Missing .env file** → Script creates it automatically
2. **Port conflicts** → Change port in docker-compose.prod.yml
3. **NGINX integration fails** → Use 172.17.0.1 instead of host.docker.internal on Linux
4. **Database errors** → Check backend/.env DATABASE_URL is correct
