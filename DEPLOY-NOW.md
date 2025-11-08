# Deploy Now - Quick Reference

## Pre-Deployment Checklist

- [ ] DNS configured (tasks.arnereabel.com → 46.62.216.163)
- [ ] SSH access working: `ssh arner@46.62.216.163`
- [ ] All files committed and pushed to GitHub

## Deployment Commands

**Copy and paste these commands in YOUR terminal:**

```bash
# 1. SSH to VPS
ssh arner@46.62.216.163

# 2. Clone repository
cd /home/arner
git clone https://github.com/arnereabel/tasks.git

# 3. Enter directory
cd tasks

# 4. Make script executable
chmod +x deploy-vps.sh

# 5. Run deployment
./deploy-vps.sh
```

## Expected Timeline

- Cloning repository: ~30 seconds
- Building Docker images: ~2-5 minutes
- Starting containers: ~30 seconds
- SSL certificate: ~1 minute
- **Total**: ~5-7 minutes

## Watching Progress

The script will show progress for each step:
```
[1/7] Cloning/updating repository...
[2/7] Configuring nginx...
[3/7] Deploying with Docker Compose...
[4/7] Waiting for services...
[5/7] Checking service health...
[6/7] Reloading nginx...
[7/7] Setting up SSL...
```

## If Something Goes Wrong

### DNS Not Ready
```bash
# Check DNS
nslookup tasks.arnereabel.com

# If not ready, skip SSL for now
# Edit deploy-vps.sh and comment out the SSL section
```

### Port Already in Use
```bash
# Check port 8080
sudo lsof -i :8080

# If needed, change port in docker-compose.prod.yml
nano docker-compose.prod.yml
# Change "8080:80" to "8081:80" or another free port
```

### Docker Build Fails
```bash
# Check Docker status
sudo systemctl status docker

# Rebuild manually
cd /home/arner/tasks
docker-compose -f docker-compose.prod.yml build --no-cache
```

## Verification Commands

After deployment completes:

```bash
# 1. Check containers are running
docker ps | grep tasks

# 2. Check backend health
curl http://localhost:3001/api/health

# 3. Check frontend (internal)
curl http://localhost:8080

# 4. Check via domain
curl http://tasks.arnereabel.com

# 5. View logs
docker logs tasks-backend
docker logs tasks-frontend
```

## Success Indicators

✅ You should see:
- Two containers running (tasks-backend, tasks-frontend)
- Nginx configuration test passed
- SSL certificate installed
- "Deployment Complete!" message

## After Successful Deployment

1. **Open in browser**: https://tasks.arnereabel.com
2. **Test API**: https://tasks.arnereabel.com/api/health
3. **Create test job** to verify functionality
4. **Upload a photo** to test file uploads
5. **Check real-time updates** (open in two browser tabs)

## Troubleshooting

If you encounter errors:
1. **Copy the error message**
2. **Check logs**: `docker logs tasks-backend --tail 50`
3. **Share error with me** - Toggle back to Plan mode and paste the error

## Manual Rollback

If you need to undo the deployment:

```bash
cd /home/arner/tasks
docker-compose -f docker-compose.prod.yml down
sudo rm /etc/nginx/sites-enabled/tasks
sudo systemctl reload nginx
```

## Need Help?

I'm here to assist! If you encounter any issues:
1. Copy the error message
2. Let me know what step failed
3. I'll help you troubleshoot

---

**Ready? Open your terminal and run the deployment commands!**
