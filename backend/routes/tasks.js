const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Task, Job, Photo, Note } = require('../models');

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.findAll({
      include: [
        { model: Job },
        { model: Photo },
        { model: Note }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get tasks by team
router.get('/team/:teamId', async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { assignedTo: req.params.teamId },
      include: [
        { model: Job },
        { model: Photo },
        { model: Note }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching team tasks:', error);
    res.status(500).json({ error: 'Failed to fetch team tasks' });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: Job },
        { model: Photo },
        { model: Note }
      ]
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const task = await Task.create(req.body);
    
    // Fetch task with associations
    const fullTask = await Task.findByPk(task.id, {
      include: [{ model: Job }, { model: Photo }, { model: Note }]
    });
    
    // Emit socket event
    req.app.get('io').emit('task:created', fullTask);
    
    res.status(201).json(fullTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task (including status)
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await task.update(req.body);
    
    // Fetch updated task with associations
    const updatedTask = await Task.findByPk(task.id, {
      include: [{ model: Job }, { model: Photo }, { model: Note }]
    });
    
    // Emit socket event
    req.app.get('io').emit('task:updated', updatedTask);
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await task.destroy();
    
    // Emit socket event
    req.app.get('io').emit('task:deleted', { id: req.params.id });
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Upload photo for task
router.post('/:id/photos', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const photo = await Photo.create({
      taskId: req.params.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      caption: req.body.caption || '',
      path: `/uploads/${req.file.filename}`
    });
    
    // Emit socket event
    req.app.get('io').emit('photo:uploaded', photo);
    
    res.status(201).json(photo);
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Get photos for task
router.get('/:id/photos', async (req, res) => {
  try {
    const photos = await Photo.findAll({
      where: { taskId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Update photo caption
router.put('/photos/:id', async (req, res) => {
  try {
    const photo = await Photo.findByPk(req.params.id);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    await photo.update({ caption: req.body.caption });
    res.json(photo);
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

// Delete photo
router.delete('/photos/:id', async (req, res) => {
  try {
    const photo = await Photo.findByPk(req.params.id);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    await photo.destroy();
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Add note to task
router.post('/:id/notes', async (req, res) => {
  try {
    const note = await Note.create({
      taskId: req.params.id,
      content: req.body.content
    });
    
    // Emit socket event
    req.app.get('io').emit('note:added', note);
    
    res.status(201).json(note);
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Get notes for task
router.get('/:id/notes', async (req, res) => {
  try {
    const notes = await Note.findAll({
      where: { taskId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Delete note
router.delete('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    await note.destroy();
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;
