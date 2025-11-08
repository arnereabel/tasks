# Task Distribution App

A mobile-friendly web application for managing welding tasks and job distribution across teams. Designed specifically for smartphone use (optimized for Samsung S25 Ultra and similar devices).

## Features

- 📋 **Dashboard**: Overview of all active jobs with search and filtering
- 🔧 **Job Details**: Complete job information with team assignments
- 👥 **Team Views**: Individual pages for each team showing all their tasks
- 📝 **Task Management**: Detailed task views with status tracking
- 📸 **Photo Capture**: Take and store photos directly from your smartphone camera
- 💬 **Notes System**: Add comments and notes to tasks for team communication
- ✅ **Status Tracking**: Update task status (Pending/In Progress/Completed)

## Getting Started

### Quick Start

1. Open `index.html` in a web browser (or set up a local server - see below)
2. The dashboard will display all active jobs
3. Tap any job to see its details
4. Navigate to team views or specific tasks
5. Take photos and add notes as needed

### For Smartphones

#### Option 1: Using a Simple HTTP Server (Recommended)

For the camera feature to work properly on smartphones, you need to serve the files over HTTP or HTTPS:

**Using Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Using Node.js:**
```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000
```

Then access the app at: `http://your-computer-ip:8000` from your smartphone

#### Option 2: Deploy to a Web Server

Upload all files to a web hosting service:
- The files are static HTML/CSS/JS
- No server-side processing required
- Any basic web hosting will work
- For production, use HTTPS for camera access

### Network Setup for Testing

1. Connect your computer and smartphone to the same Wi-Fi network
2. Find your computer's local IP address:
   - **Windows**: Run `ipconfig` in command prompt
   - **macOS/Linux**: Run `ifconfig` or `ip addr`
3. Start the HTTP server on your computer
4. Open your smartphone browser and navigate to `http://[your-ip]:8000`

## File Structure

```
task-distribution-app/
├── index.html          # Main dashboard page
├── job.html           # Job detail page
├── welder.html        # Team/welder view page
├── task.html          # Task detail page with photos
├── style.css          # Mobile-responsive styling
├── app.js             # Application logic
├── data.json          # Job and task data
└── README.md          # This file
```

## Data Structure

### Adding New Jobs

Edit `data.json` to add new jobs:

```json
{
  "id": "job004",
  "orderNumber": "ORD-2024-004",
  "hal": "HAL D",
  "plaats": "Position 2",
  "fase": "Phase 1",
  "tekMerk": "DWG-004-D",
  "priority": "high",
  "polDag": "2",
  "prtDag": "1",
  "prt": "2",
  "pl": "1",
  "metr": "0",
  "remarks": "Special instructions here",
  "tasks": [
    {
      "id": "task006",
      "description": "Task description",
      "assignedTo": "POL-dag",
      "status": "pending",
      "notes": [],
      "photos": []
    }
  ]
}
```

### Team IDs

- `POL-dag` - Polish Dayshift
- `PRT-dag` - Portuguese Dayshift
- `PRT` - Portuguese Evening
- `PL` - Polish Evening
- `METR` - Metrica Evening

### Priority Levels

- `high` - Red indicator, urgent tasks
- `medium` - Yellow indicator, normal priority
- `low` - Green indicator, can be scheduled

### Task Status

- `pending` - Not yet started
- `in-progress` - Currently being worked on
- `completed` - Finished

## Using the App

### Dashboard (Main Page)

- **Search**: Use the search bar to find jobs by order number, location, or hall
- **Filter**: Tap team buttons to filter jobs by assigned team
- **View Job**: Tap any job card to see full details

### Job Detail Page

- **Overview**: See all job information at a glance
- **Team Assignment**: View how many workers are assigned from each team
- **Tasks**: List of all tasks for this job
- **Team Links**: Quick navigation to see each team's tasks

### Team/Welder View

- **Task List**: All tasks assigned to the selected team
- **Sorting**: Sort tasks by priority, order number, location, or status
- **Cross-Job View**: See all tasks across all jobs for this team

### Task Detail Page

#### Taking Photos

1. Tap "📷 Take Photo" to open your camera
2. Take the photo
3. Photo is automatically saved to the task
4. Tap any photo to view it full-screen
5. Add captions to photos for context
6. Delete photos if needed

#### Adding Notes

1. Type your note in the text area
2. Tap "Add Note"
3. Notes are timestamped automatically
4. All team members can see notes

#### Updating Status

1. Tap the status button that matches the task's current state
2. Status updates immediately
3. Status is visible in all views

## Data Storage

- **Base Data**: Stored in `data.json`
- **Photos & Notes**: Stored in browser's LocalStorage
- **Persistence**: Data persists between sessions on the same device
- **Sharing**: To share data between devices, you'll need to implement a backend server

### Important Notes

- Photos are stored as base64 data in LocalStorage
- LocalStorage has a limit (usually 5-10MB)
- For many photos, consider implementing cloud storage
- Clear browser data will reset photos and notes to original data.json

## Browser Compatibility

### Recommended Browsers

- **Chrome/Edge**: Full support including camera
- **Safari**: Full support (iOS 11+)
- **Firefox**: Full support
- **Samsung Internet**: Full support

### Camera Requirements

- HTTPS connection (for production)
- Camera permission granted
- Modern browser with getUserMedia API support

## Customization

### Changing Colors

Edit `style.css` to customize the color scheme:

```css
:root {
    --primary-color: #2563eb;    /* Main blue color */
    --success-color: #10b981;     /* Green for completed */
    --warning-color: #f59e0b;     /* Yellow for pending */
    --danger-color: #ef4444;      /* Red for urgent */
}
```

### Adding More Teams

1. Add team to `data.json` in the `teams` array:
```json
{
  "id": "NEW-TEAM",
  "name": "Short Name",
  "fullName": "Full Team Name"
}
```

2. Update filter buttons in `index.html`

### Modifying Layout

- Adjust grid layouts in `style.css`
- Change responsive breakpoints for different screen sizes
- Modify font sizes for better readability

## Troubleshooting

### Camera Not Working

- Ensure you're using HTTPS or localhost
- Check browser permissions for camera access
- Try a different browser
- Restart the app and grant permissions again

### Photos Not Saving

- Check browser's LocalStorage isn't full
- Ensure JavaScript is enabled
- Try clearing browser cache and reloading

### App Not Loading on Phone

- Verify your phone and computer are on the same network
- Check firewall isn't blocking the port
- Ensure the server is running
- Try the computer's IP address instead of `localhost`

### Data Lost After Refresh

- Normal for demo mode - photos/notes reset to `data.json`
- Implement a backend API for permanent storage
- Or export LocalStorage data before clearing cache

## Future Enhancements

Potential improvements:

1. **Backend Integration**: Save data to a database
2. **User Authentication**: Login system for different roles
3. **Real-time Sync**: Live updates across devices
4. **Offline Mode**: Service worker for offline capability
5. **Export Reports**: Generate PDF reports of completed work
6. **Photo Compression**: Reduce storage requirements
7. **Push Notifications**: Alert teams of new tasks
8. **Time Tracking**: Log time spent on tasks

## Converting Your Spreadsheet Data

To convert your existing spreadsheet to the app format:

1. Export your spreadsheet to CSV
2. For each row, create a job object in `data.json`
3. Break down tasks into the `tasks` array
4. Assign appropriate team IDs and priorities
5. Test the data in the app

## Support

For issues or questions:
- Check this README
- Review the browser console for errors
- Verify all files are in the correct location
- Ensure you're running a local server for camera access

## License

This project is provided as-is for internal use.
