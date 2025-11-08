// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api' 
    : '/api';

// Socket.IO Connection
let socket = null;

function initializeSocket() {
    const socketUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : window.location.origin;
    
    socket = io(socketUrl);
    
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
    
    // Listen for real-time updates
    socket.on('job:created', (job) => {
        console.log('New job created:', job);
        if (typeof onJobCreated === 'function') onJobCreated(job);
    });
    
    socket.on('job:updated', (job) => {
        console.log('Job updated:', job);
        if (typeof onJobUpdated === 'function') onJobUpdated(job);
    });
    
    socket.on('job:deleted', (data) => {
        console.log('Job deleted:', data);
        if (typeof onJobDeleted === 'function') onJobDeleted(data);
    });
    
    socket.on('task:created', (task) => {
        console.log('Task created:', task);
        if (typeof onTaskCreated === 'function') onTaskCreated(task);
    });
    
    socket.on('task:updated', (task) => {
        console.log('Task updated:', task);
        if (typeof onTaskUpdated === 'function') onTaskUpdated(task);
    });
    
    socket.on('task:deleted', (data) => {
        console.log('Task deleted:', data);
        if (typeof onTaskDeleted === 'function') onTaskDeleted(data);
    });
    
    socket.on('photo:uploaded', (photo) => {
        console.log('Photo uploaded:', photo);
        if (typeof onPhotoUploaded === 'function') onPhotoUploaded(photo);
    });
    
    socket.on('note:added', (note) => {
        console.log('Note added:', note);
        if (typeof onNoteAdded === 'function') onNoteAdded(note);
    });
    
    return socket;
}

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || 'Request failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Job API Functions
const JobAPI = {
    async getAll() {
        return apiRequest('/jobs');
    },
    
    async getById(jobId) {
        return apiRequest(`/jobs/${jobId}`);
    },
    
    async create(jobData) {
        return apiRequest('/jobs', {
            method: 'POST',
            body: JSON.stringify(jobData)
        });
    },
    
    async update(jobId, jobData) {
        return apiRequest(`/jobs/${jobId}`, {
            method: 'PUT',
            body: JSON.stringify(jobData)
        });
    },
    
    async delete(jobId) {
        return apiRequest(`/jobs/${jobId}`, {
            method: 'DELETE'
        });
    }
};

// Task API Functions
const TaskAPI = {
    async getAll() {
        return apiRequest('/tasks');
    },
    
    async getById(taskId) {
        return apiRequest(`/tasks/${taskId}`);
    },
    
    async getByTeam(teamId) {
        return apiRequest(`/tasks/team/${teamId}`);
    },
    
    async create(taskData) {
        return apiRequest('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    },
    
    async update(taskId, taskData) {
        return apiRequest(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
        });
    },
    
    async updateStatus(taskId, status) {
        return apiRequest(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },
    
    async delete(taskId) {
        return apiRequest(`/tasks/${taskId}`, {
            method: 'DELETE'
        });
    },
    
    // Photo operations
    async uploadPhoto(taskId, file, caption = '') {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('caption', caption);
        
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/photos`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(error.error || 'Upload failed');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Photo upload failed:', error);
            throw error;
        }
    },
    
    async getPhotos(taskId) {
        return apiRequest(`/tasks/${taskId}/photos`);
    },
    
    async updatePhotoCaption(photoId, caption) {
        return apiRequest(`/tasks/photos/${photoId}`, {
            method: 'PUT',
            body: JSON.stringify({ caption })
        });
    },
    
    async deletePhoto(photoId) {
        return apiRequest(`/tasks/photos/${photoId}`, {
            method: 'DELETE'
        });
    },
    
    // Note operations
    async addNote(taskId, content) {
        return apiRequest(`/tasks/${taskId}/notes`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    },
    
    async getNotes(taskId) {
        return apiRequest(`/tasks/${taskId}/notes`);
    },
    
    async deleteNote(noteId) {
        return apiRequest(`/tasks/notes/${noteId}`, {
            method: 'DELETE'
        });
    }
};

// Migration Helper - Import existing data to backend
async function migrateLocalDataToBackend() {
    try {
        // Load existing data from localStorage
        const savedData = localStorage.getItem('appData');
        if (!savedData) {
            console.log('No local data to migrate');
            return;
        }
        
        const localData = JSON.parse(savedData);
        
        // Create jobs with tasks
        for (const job of localData.jobs) {
            try {
                // Create job
                const createdJob = await JobAPI.create({
                    orderNumber: job.orderNumber,
                    hal: job.hal,
                    plaats: job.plaats,
                    fase: job.fase,
                    tekMerk: job.tekMerk,
                    priority: job.priority,
                    polDag: job.polDag,
                    prtDag: job.prtDag,
                    prt: job.prt,
                    pl: job.pl,
                    metr: job.metr,
                    remarks: job.remarks
                });
                
                // Create tasks for this job
                for (const task of job.tasks) {
                    const createdTask = await TaskAPI.create({
                        jobId: createdJob.id,
                        description: task.description,
                        assignedTo: task.assignedTo,
                        status: task.status
                    });
                    
                    // Add notes
                    if (task.notes) {
                        for (const note of task.notes) {
                            await TaskAPI.addNote(createdTask.id, note.content);
                        }
                    }
                    
                    // Note: Photos stored as base64 in localStorage would need special handling
                    // They should be converted to actual file uploads
                }
            } catch (error) {
                console.error(`Failed to migrate job ${job.orderNumber}:`, error);
            }
        }
        
        console.log('Migration completed');
        
        // Backup old data
        localStorage.setItem('appData_backup', savedData);
        localStorage.removeItem('appData');
        
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

// Health check
async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const health = await response.json();
        console.log('Backend health:', health);
        return health.status === 'ok';
    } catch (error) {
        console.error('Backend health check failed:', error);
        return false;
    }
}
