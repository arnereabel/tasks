# Quick Start Guide

## Backend is Running!

Your Task Distribution System backend is now running successfully at:
- **API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## Testing the Application

### Option 1: Open Frontend Directly (Simple)
1. Open `index.html` in your browser
2. The frontend will connect to the backend running on port 3001

### Option 2: Use a Local Web Server (Recommended)
```bash
# In a new terminal, from the project root
npx http-server -p 8080
```
Then open http://localhost:8080

### Option 3: Docker Deployment (Production-Ready)
```bash
# Stop the current backend (Ctrl+C in the terminal)
# Then run:
docker-compose up -d

# Access at http://localhost
```

## Initial Setup

### Import Existing Data (if you have localStorage data)
1. Open the frontend in your browser
2. Open browser console (F12)
3. Run: `migrateLocalDataToBackend()`

### Create Your First Job via API
```bash
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "TEST-001",
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
    "remarks": "Test job"
  }'
```

### Create a Task for the Job
```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": 1,
    "description": "Test welding task",
    "assignedTo": "POL-dag",
    "status": "pending"
  }'
```

## Testing Features

### 1. Dashboard
- Open `index.html`
- View all jobs
- Search and filter by team

### 2. Job Details
- Click on any job card
- View team assignments
- See all tasks for the job

### 3. Team View
- Click on a team link
- View all tasks assigned to that team
- Sort by priority, status, etc.

### 4. Task Management
- Click on any task
- Update status (Pending → In Progress → Completed)
- Add notes
- Upload photos

### 5. Real-Time Updates
- Open the app in two browser windows
- Make changes in one window
- Watch the other window update automatically via WebSocket

## API Endpoints

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get single job
- `POST /api/jobs` - Create job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/team/:teamId` - Get tasks by team
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Photos
- `POST /api/tasks/:id/photos` - Upload photo
- `GET /api/tasks/:id/photos` - Get photos
- `PUT /api/tasks/photos/:id` - Update caption
- `DELETE /api/tasks/photos/:id` - Delete photo

### Notes
- `POST /api/tasks/:id/notes` - Add note
- `GET /api/tasks/:id/notes` - Get notes
- `DELETE /api/tasks/notes/:id` - Delete note

## Database Location

The SQLite database is stored at:
```
backend/data/tasks.db
```

Photos are stored at:
```
backend/uploads/
```

## Stopping the Server

Press `Ctrl+C` in the terminal where the backend is running.

## Next Steps

1. **Test the application** with the frontend
2. **Deploy with Docker** when ready for production
3. **Set up backups** for the database and uploads
4. **Configure SSL** if deploying to production
5. **Customize** team names and workflows as needed

## Troubleshooting

### Port 3001 already in use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Cannot connect to backend
- Verify backend is running: Check terminal output
- Check firewall: Ensure port 3001 is accessible
- Test health endpoint: http://localhost:3001/api/health

### Photos not uploading
- Check `backend/uploads/` directory exists
- Verify file permissions
- Check available disk space

## Support

See `README.md` for full documentation and deployment guides.
