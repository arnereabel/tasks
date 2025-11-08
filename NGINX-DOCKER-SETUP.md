# Adding Tasks to Your Dockerized Nginx

Since your nginx is running in a Docker container (`nginx_web`), here's how to add the Tasks application configuration.

## Current Setup

- **Nginx Container**: `nginx_web`
- **Config File**: `~/robotics_deployment/nginx/conf/nginx.conf`
- **Network**: `proxy_network`
- **Container Frontend**: Files are in `~/tasks/`

## Step-by-Step Instructions

### 1. Edit the Existing Nginx Config

Open your nginx configuration file:

```bash
cd ~/robotics_deployment/nginx/conf
nano nginx.conf
```

### 2. Add Tasks Configuration

Add this **new server block** at the end of the file (after the existing server block for ROS2):

```nginx
# Tasks Application - New server block
upstream tasks_backend {
    server tasks-backend:3001;
}

server {
    listen 80;
    server_name tasks.arnereabel.com;

    # Frontend files location
    root /usr/share/nginx/html/tasks;

    # Serve frontend files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://tasks_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io WebSocket
    location /socket.io/ {
        proxy_pass http://tasks_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploaded files
    location /uploads/ {
        alias /usr/share/nginx/html/tasks/backend/uploads/;
        autoindex off;
    }
}
```

Save and exit (Ctrl+X, then Y, then Enter).

### 3. Mount Tasks Files in Docker

Edit your docker-compose.yml to mount the tasks directory:

```bash
cd ~/robotics_deployment
nano docker-compose.yml
```

Find the `nginx` service volumes section and add the tasks mount:

```yaml
volumes:
  - ./nginx/www:/usr/share/nginx/html:ro
  - ./nginx/conf/nginx.conf:/etc/nginx/conf.d/default.conf:ro
  - /home/arner/tasks:/usr/share/nginx/html/tasks:ro  # Add this line
```

Save and exit.

### 4. Restart Nginx Container

```bash
cd ~/robotics_deployment
docker-compose restart nginx
```

### 5. Verify Configuration

Check nginx logs:
```bash
docker logs nginx_web
```

Test the configuration:
```bash
docker exec nginx_web nginx -t
```

### 6. Test the Application

Visit: **http://tasks.arnereabel.com** (or your VPS IP)

You should see the Tasks application!

### 7. Setup SSL (Optional)

If you want HTTPS, you'll need to:
1. Add certbot to your docker-compose
2. Or use a reverse proxy like Traefik/Caddy
3. Or manually configure Let's Encrypt certificates

---

## Troubleshooting

### Backend Not Reachable (502 Bad Gateway)

Check if backend is on the network:
```bash
docker network inspect proxy_network | grep tasks-backend
```

Check if backend is running:
```bash
docker ps | grep tasks-backend
```

### Frontend Files Not Loading

Check if tasks directory is mounted:
```bash
docker exec nginx_web ls -la /usr/share/nginx/html/tasks/
```

Should see: index.html, style.css, api.js, etc.

### Container Won't Start

Check nginx config syntax:
```bash
docker exec nginx_web nginx -t
```

View full logs:
```bash
docker logs nginx_web --tail 50
```

---

## Quick Commands

**Restart nginx after config changes:**
```bash
cd ~/robotics_deployment && docker-compose restart nginx
```

**View nginx logs:**
```bash
docker logs -f nginx_web
```

**View backend logs:**
```bash
docker logs -f tasks-backend
```

**Restart everything:**
```bash
cd ~/robotics_deployment && docker-compose restart
cd ~/tasks && docker-compose -f docker-compose.prod.yml restart
