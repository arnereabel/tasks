const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

// Import models and routes
const { sequelize } = require('./models');
const jobsRouter = require('./routes/jobs');
const tasksRouter = require('./routes/tasks');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Store io instance in app for use in routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/jobs', jobsRouter);
app.use('/api/tasks', tasksRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: sequelize.getDatabaseName()
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
  
  // Handle real-time updates
  socket.on('task:status', (data) => {
    io.emit('task:status:updated', data);
  });
  
  socket.on('team:update', (data) => {
    io.emit('team:updated', data);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error' 
  });
});

// Database initialization and server startup
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Sync database (creates tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('Database synchronized');
    
    // Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket server ready`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  try {
    await sequelize.close();
    console.log('Database connection closed');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();

module.exports = { app, server, io };
