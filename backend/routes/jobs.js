const express = require('express');
const router = express.Router();
const { Job, Task } = require('../models');

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.findAll({
      include: [{
        model: Task,
        attributes: ['id', 'status']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get single job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id, {
      include: [{ model: Task }]
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Create new job
router.post('/', async (req, res) => {
  try {
    const job = await Job.create(req.body);
    
    // Emit socket event
    req.app.get('io').emit('job:created', job);
    
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Update job
router.put('/:id', async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    await job.update(req.body);
    
    // Emit socket event
    req.app.get('io').emit('job:updated', job);
    
    res.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Delete job
router.delete('/:id', async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    await job.destroy();
    
    // Emit socket event
    req.app.get('io').emit('job:deleted', { id: req.params.id });
    
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

module.exports = router;
