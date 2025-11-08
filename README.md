# Task Distribution System

A web-based task management system for distributing welding and construction tasks across multiple teams with real-time updates, photo documentation, and progress tracking.

## Features

- 📋 Job and task management
- 👥 Multi-team assignment and tracking
- 📸 Photo upload and documentation
- 📝 Real-time notes and comments
- 🔄 Live status updates via WebSocket
- 📱 Mobile-friendly interface
- 🔍 Search and filtering capabilities
- 🎯 Priority-based task organization

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Socket.IO Client for real-time updates
- Responsive design for mobile and desktop

### Backend
- Node.js + Express
- Socket.IO for WebSocket communication
- Sequelize ORM
- SQLite database
- Multer for file uploads

### Deployment
- Docker & Docker Compose
- Nginx reverse proxy
- Persistent volumes for data and uploads

## Project Structure

```
app jelle/
├── backend/
│   ├── models/
│   │   └── index.js          # Database models (Job, Task, Photo, Note)
│   ├── routes/
│   │   ├── jobs.js           # Job API endpoints
│   │   └── tasks.js          # Task API endpoints
│   ├── data/                 # SQLite database storage
│   ├── uploads/              # Uploaded photos
│   ├── server.js             # Express server setup
│   ├── package.json          # Backend dependencies
│   └── Dockerfile            # Backend container config
├── index.html                # Dashboard page
├── job.html                  # Job details page
├── welder.html               # Team view page
├── task.html                 # Task details page
├── style.css                 # Global styles
├── app.js                    # Frontend logic
├── api.js                    # API client & Socket.IO
├── data.json                 # Initial data structure
├── docker-compose.yml        # Docker orchestration
├── nginx.conf                # Nginx configuration
└── README.md                 # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ (for local development)
- Docker & Docker Compose (for production deployment)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/arnereabel/weldertasks.git
   cd weldertasks
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start the backend server**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:3001`

4. **Open the frontend**
   - Open `index.html` in a web browser
   - Or use a local server: `npx http-server -p 8080`

### Docker Deployment

1. **Build and start containers**
   ```bash
   docker-compose up -d
   ```

2. **Check container status**
   ```bash
   docker-compose ps
   ```

3. **View logs**
   ```bash
   docker-compose logs -f
   ```

4. **Stop containers**
   ```bash
   docker-compose down
   ```

5. **Access the application**
   - Frontend: `http://localhost`
   - Backend API: `http://localhost:3001/api`
   - Health Check: `http://localhost:3001/api/health`

### Production Deployment

For production deployment on a VPS or cloud server:

1. **Clone the repository on your server**
   ```bash
   git clone https://github.com/arnereabel/weldertasks.git
   cd weldertasks
   ```

2. **Configure environment (optional)**
   - Update `CORS_ORIGIN` in `docker-compose.yml`
   - Configure domain in `nginx.conf` if needed

3. **Deploy with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Set up SSL (recommended)**
   - Use Let's Encrypt with Certbot
   - Or configure your cloud provider's SSL

5. **Configure firewall**
   ```bash
   # Allow HTTP and HTTPS
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

## API Documentation

### Jobs API

#### Get All Jobs
```
GET /api/jobs
```

#### Get Job by ID
```
GET /api/jobs/:id
```

#### Create Job
```
POST /api/jobs
Content-Type: application/json

{
  "orderNumber": "12345",
  "hal": "HAL-1",
  "plaats": "Section A",
  "fase": "Phase 1",
  "tekMerk": "DWG-001",
  "priority": "high",
  "polDag": 2,
  "prtDag": 1,
  "prt": 0,
  "pl": 0,
  "metr": 0,
  "remarks": "Special requirements"
}
```

#### Update Job
```
PUT /api/jobs/:id
Content-Type: application/json
```

#### Delete Job
```
DELETE /api/jobs/:id
```

### Tasks API

#### Get All Tasks
```
GET /api/tasks
```

#### Get Tasks by Team
```
GET /api/tasks/team/:teamId
```

#### Get Task by ID
```
GET /api/tasks/:id
```

#### Create Task
```
POST /api/tasks
Content-Type: application/json

{
  "jobId": 1,
  "description": "Weld beam connections",
  "assignedTo": "POL-dag",
  "status": "pending"
}
```

#### Update Task Status
```
PUT /api/tasks/:id
Content-Type: application/json

{
  "status": "in-progress"
}
```

#### Upload Photo
```
POST /api/tasks/:id/photos
Content-Type: multipart/form-data

photo: [file]
caption: "Photo description"
```

#### Add Note
```
POST /api/tasks/:id/notes
Content-Type: application/json

{
  "content": "Note content here"
}
```

### WebSocket Events

The application uses Socket.IO for real-time updates:

**Client → Server:**
- `task:status` - Task status changed
- `team:update` - Team information updated

**Server → Client:**
- `job:created` - New job created
- `job:updated` - Job updated
- `job:deleted` - Job deleted
- `task:created` - New task created
- `task:updated` - Task updated
- `task:deleted` - Task deleted
- `photo:uploaded` - Photo uploaded
- `note:added` - Note added

## Data Migration

To migrate existing localStorage data to the backend:

1. Open browser console on the frontend
2. Run: `migrateLocalDataToBackend()`
3. This will transfer all jobs, tasks, and notes to the database

## Backup and Restore

### Backup Database
```bash
docker exec tasks-backend tar czf /app/backup.tar.gz /app/data /app/uploads
docker cp tasks-backend:/app/backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz
```

### Restore Database
```bash
docker cp ./backup-YYYYMMDD.tar.gz tasks-backend:/app/backup.tar.gz
docker exec tasks-backend tar xzf /app/backup.tar.gz -C /app
docker-compose restart backend
```

## Maintenance

### View Backend Logs
```bash
docker-compose logs -f backend
```

### View Frontend Logs
```bash
docker-compose logs -f frontend
```

### Restart Services
```bash
docker-compose restart
```

### Update Application
```bash
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d
```

## Troubleshooting

### Backend won't start
- Check logs: `docker-compose logs backend`
- Verify port 3001 is not in use: `netstat -tulpn | grep 3001`
- Check database permissions in `backend/data/`

### WebSocket connection fails
- Verify nginx WebSocket proxy configuration
- Check browser console for connection errors
- Ensure firewall allows WebSocket connections

### Photos not uploading
- Check `backend/uploads/` directory permissions
- Verify file size limits in `backend/routes/tasks.js`
- Check available disk space

### Database errors
- Check SQLite database file integrity
- Restore from backup if corrupted
- Clear browser cache and localStorage

## Security Considerations

- Change default CORS settings in production
- Use HTTPS in production environments
- Implement authentication if needed
- Regularly backup database
- Keep dependencies updated
- Limit upload file sizes
- Sanitize user inputs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For issues and questions:
- Open an issue on GitHub
- Contact the development team

## Version History

### v2.0.0 (Current)
- Added backend API with Express and SQLite
- Implemented real-time updates with Socket.IO
- Added photo upload to server
- Containerized with Docker
- Added nginx reverse proxy

### v1.0.0
- Initial release with localStorage
- Basic task management
- Client-side only implementation
