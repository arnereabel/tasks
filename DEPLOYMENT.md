# VPS Deployment Guide

## Prerequisites

1. **DNS Configuration**
   - Add an A record for `tasks.arnereabel.com` pointing to `46.62.216.163`
   - Wait for DNS propagation (can take 5-60 minutes)
   - Verify with: `nslookup tasks.arnereabel.com`

2. **VPS Access**
   - SSH access as user `arner`
   - Docker and Docker Compose installed ✅ (already present)
   - Nginx installed ✅ (already running)
   - Ports 80 and 443 open ✅ (already configured)

## Quick Deployment

### Option 1: Automated Script (Recommended)

SSH into your VPS and run:

```bash
ssh arner@46.62.216.163
cd /home/arner
git clone https://github.com/arnereabel/tasks.git
cd tasks
chmod +x deploy-vps.sh
./deploy-vps.sh
```

The script will:
1. Clone/update the repository
2. Configure nginx for the subdomain
3. Build and deploy Docker containers
4. Set up SSL certificate
5. Verify deployment

### Option 2: Manual Deployment

If you prefer manual control:

```bash
# 1. SSH to VPS
ssh arner@46.62.216.163

# 2. Clone repository
cd /home/arner
git clone https://github.com/arnereabel/tasks.git
cd tasks

# 3. Configure nginx
sudo cp nginx-subdomain.conf /etc/nginx/sites-available/tasks
sudo ln -s /etc/nginx/sites-available/tasks /etc/nginx/sites-enabled/tasks
sudo nginx -t
sudo systemctl reload nginx

# 4. Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 5. Check status
docker ps
docker logs tasks-backend
docker logs tasks-frontend

# 6. Setup SSL (optional but recommended)
sudo certbot --nginx -d tasks.arnereabel.com
```

## Architecture on VPS

### Container Layout
```
VPS (46.62.216.163)
├── Nginx (Host, Port 80/443)
│   ├── → tasks.arnereabel.com (Port 8080) → tasks-frontend container
│   ├── → tasks.arnereabel.com/api → tasks-backend:3001
│   └── → tasks.arnereabel.com/socket.io → tasks-backend:3001
├── tasks-backend container (Port 3001, internal)
│   ├── Express API
│   ├── Socket.IO
│   └── SQLite database
└── tasks-frontend container (Port 8080, internal)
    └── Nginx serving static files
```

### Network Configuration
- Both containers join existing `robotics_deployment_proxy_network`
- No port conflicts with existing ROS2 services
- Backend accessible only through frontend container and host nginx

## Post-Deployment

### Verify Deployment

1. **Check DNS**
   ```bash
   nslookup tasks.arnereabel.com
   # Should return: 46.62.216.163
   ```

2. **Test HTTP**
   ```bash
   curl http://tasks.arnereabel.com
   # Should return HTML
   ```

3. **Test API**
   ```bash
   curl http://tasks.arnereabel.com/api/health
   # Should return: {"status":"ok",...}
   ```

4. **Test HTTPS** (after SSL setup)
   ```bash
   curl https://tasks.arnereabel.com
   ```

5. **Open in Browser**
   - Visit: https://tasks.arnereabel.com
   - Should see the dashboard

### View Logs

```bash
# Backend logs
docker logs -f tasks-backend

# Frontend logs
docker logs -f tasks-frontend

# All containers
docker-compose -f docker-compose.prod.yml logs -f
```

### Manage Services

```bash
# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml down

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# View running containers
docker ps | grep tasks
```

## Updating the Application

When you push changes to GitHub:

```bash
# SSH to VPS
ssh arner@46.62.216.163
cd /home/arner/tasks

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## SSL Certificate Management

### Initial Setup
```bash
sudo certbot --nginx -d tasks.arnereabel.com
```

### Auto-Renewal
Certbot automatically renews certificates. Verify:
```bash
sudo certbot renew --dry-run
```

### Manual Renewal
```bash
sudo certbot renew
sudo systemctl reload nginx
```

## Backup Strategy

### Database Backup
```bash
# Create backup
docker exec tasks-backend tar czf /tmp/backup.tar.gz /app/data /app/uploads
docker cp tasks-backend:/tmp/backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz

# Restore backup
docker cp backup-YYYYMMDD.tar.gz tasks-backend:/tmp/backup.tar.gz
docker exec tasks-backend tar xzf /tmp/backup.tar.gz -C /app
docker-compose -f docker-compose.prod.yml restart
```

### Automated Daily Backup
Add to crontab:
```bash
crontab -e

# Add line:
0 2 * * * cd /home/arner/tasks && docker exec tasks-backend tar czf /tmp/backup.tar.gz /app/data /app/uploads && docker cp tasks-backend:/tmp/backup.tar.gz /home/arner/backups/tasks-$(date +\%Y\%m\%d).tar.gz
```

## Troubleshooting

### Port Already in Use
If port 8080 is in use:
```bash
# Check what's using the port
sudo lsof -i :8080

# Change port in docker-compose.prod.yml
# Then restart services
```

### Container Won't Start
```bash
# Check logs
docker logs tasks-backend --tail 100
docker logs tasks-frontend --tail 100

# Check container status
docker ps -a | grep tasks

# Remove and recreate
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Nginx Configuration Error
```bash
# Test configuration
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Reload nginx
sudo systemctl reload nginx
```

### Database Issues
```bash
# Check database file
docker exec tasks-backend ls -lh /app/data/

# Check permissions
docker exec tasks-backend chmod 666 /app/data/tasks.db

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

### DNS Not Resolving
```bash
# Check DNS propagation
nslookup tasks.arnereabel.com

# Wait for propagation (can take up to 1 hour)
# Test with different DNS servers
nslookup tasks.arnereabel.com 8.8.8.8
```

## Security Considerations

1. **Firewall** - Already configured ✅
   - UFW blocking all except 22, 80, 443

2. **Fail2Ban** - Already active ✅
   - Monitoring SSH attempts

3. **SSL/TLS** - Configure after DNS propagation
   - Let's Encrypt certificate
   - Auto-renewal enabled

4. **Database**
   - Stored in Docker volume
   - Not exposed to network
   - Regular backups recommended

5. **Uploads**
   - Limited to 10MB per file
   - Only images accepted
   - Stored in Docker volume

## Monitoring

### Check Service Health
```bash
# API health endpoint
curl http://tasks.arnereabel.com/api/health

# Container health
docker ps --filter "name=tasks"

# Resource usage
docker stats tasks-backend tasks-frontend
```

### Set Up Monitoring (Optional)
Consider adding:
- Uptime monitoring (UptimeRobot, etc.)
- Log aggregation (Papertrail, etc.)
- Performance monitoring (New Relic, DataDog, etc.)

## Support

For issues:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify DNS: `nslookup tasks.arnereabel.com`
3. Test locally: `curl http://localhost:8080`
4. Check GitHub issues: https://github.com/arnereabel/tasks/issues

## Contact

Repository: https://github.com/arnereabel/tasks
