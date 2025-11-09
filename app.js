// Global data storage
let appData = null;
let currentTaskId = null;
let currentJobId = null;
let currentPhotoIndex = null;

// Initialize data from JSON file
async function loadData() {
    try {
        const response = await fetch('data.json');
        appData = await response.json();
        
        // Merge with localStorage data (for photos and notes)
        const savedData = localStorage.getItem('appData');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            // Merge photos and notes from localStorage
            appData.jobs.forEach(job => {
                const savedJob = parsed.jobs.find(j => j.id === job.id);
                if (savedJob) {
                    job.tasks.forEach(task => {
                        const savedTask = savedJob.tasks.find(t => t.id === task.id);
                        if (savedTask) {
                            task.photos = savedTask.photos || [];
                            task.notes = savedTask.notes || [];
                            task.status = savedTask.status || task.status;
                        }
                    });
                }
            });
        }
        
        return appData;
    } catch (error) {
        console.error('Error loading data:', error);
        return null;
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('appData', JSON.stringify(appData));
}

function onJobCreated(job) {
    if (appData && appData.jobs) {
        appData.jobs.unshift(job);
        renderJobs(appData.jobs);
    }
}

// DASHBOARD FUNCTIONS
async function loadDashboard() {
    const data = await loadData();
    if (!data) return;
    
    // Update stats
    document.getElementById('totalJobs').textContent = data.jobs.length;
    const totalTasks = data.jobs.reduce((sum, job) => sum + job.tasks.length, 0);
    document.getElementById('totalTasks').textContent = totalTasks;
    
    // Render jobs
    renderJobs(data.jobs);
    
    // Setup search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = data.jobs.filter(job => 
            job.orderNumber.toLowerCase().includes(query) ||
            job.hal.toLowerCase().includes(query) ||
            job.plaats.toLowerCase().includes(query)
        );
        renderJobs(filtered);
    });
    
    // Setup team filter
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const team = btn.dataset.team;
            if (team === 'all') {
                renderJobs(data.jobs);
            } else {
                const filtered = data.jobs.filter(job => 
                    job.tasks.some(task => task.assignedTo === team)
                );
                renderJobs(filtered);
            }
        });
    });
}

function renderJobs(jobs) {
    const container = document.getElementById('jobsList');
    
    if (jobs.length === 0) {
        container.innerHTML = '<div class="photo-empty">No jobs found</div>';
        return;
    }
    
    container.innerHTML = jobs.map(job => `
        <div class="job-card priority-${job.priority}" onclick="navigateToJob('${job.id}')">
            <div class="job-card-header">
                <div class="job-number">${job.orderNumber}</div>
                <div class="priority-badge ${job.priority}">${job.priority}</div>
            </div>
            <div class="job-details">
                <div class="job-detail-item">
                    <div class="job-detail-label">Location</div>
                    <div class="job-detail-value">${job.hal} - ${job.plaats}</div>
                </div>
                <div class="job-detail-item">
                    <div class="job-detail-label">Phase</div>
                    <div class="job-detail-value">${job.fase}</div>
                </div>
                <div class="job-detail-item">
                    <div class="job-detail-label">Drawing</div>
                    <div class="job-detail-value">${job.tekMerk}</div>
                </div>
                <div class="job-detail-item">
                    <div class="job-detail-label">Tasks</div>
                    <div class="job-detail-value">${job.tasks.length} tasks</div>
                </div>
            </div>
            <div class="job-teams">
                ${job.polDag > 0 ? `<span class="team-badge">POL-D: ${job.polDag}</span>` : ''}
                ${job.prtDag > 0 ? `<span class="team-badge">PRT-D: ${job.prtDag}</span>` : ''}
                ${job.prt > 0 ? `<span class="team-badge">PRT-E: ${job.prt}</span>` : ''}
                ${job.pl > 0 ? `<span class="team-badge">PL-E: ${job.pl}</span>` : ''}
                ${job.metr > 0 ? `<span class="team-badge">METR: ${job.metr}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function navigateToJob(jobId) {
    window.location.href = `job.html?id=${jobId}`;
}

// JOB DETAIL FUNCTIONS
async function loadJobDetails(jobId) {
    const data = await loadData();
    if (!data) return;
    
    const job = data.jobs.find(j => j.id === jobId);
    if (!job) {
        window.location.href = 'index.html';
        return;
    }
    
    // Set title
    document.getElementById('jobTitle').textContent = job.orderNumber;
    
    // Render job header
    document.getElementById('jobHeader').innerHTML = `
        <div class="job-info-grid">
            <div class="job-info-item">
                <span class="info-label">Order Number</span>
                <span class="info-value">${job.orderNumber}</span>
            </div>
            <div class="job-info-item">
                <span class="info-label">Priority</span>
                <span class="info-value">
                    <span class="priority-badge ${job.priority}">${job.priority}</span>
                </span>
            </div>
            <div class="job-info-item">
                <span class="info-label">Location</span>
                <span class="info-value">${job.hal} - ${job.plaats}</span>
            </div>
            <div class="job-info-item">
                <span class="info-label">Phase</span>
                <span class="info-value">${job.fase}</span>
            </div>
            <div class="job-info-item">
                <span class="info-label">Drawing/Mark</span>
                <span class="info-value">${job.tekMerk}</span>
            </div>
        </div>
    `;
    
    // Render team assignments
    document.getElementById('teamAssignments').innerHTML = `
        ${job.polDag > 0 ? `
            <div class="team-assignment">
                <div class="team-name">Polish Dayshift</div>
                <div class="team-count">${job.polDag}</div>
            </div>
        ` : ''}
        ${job.prtDag > 0 ? `
            <div class="team-assignment">
                <div class="team-name">Portuguese Dayshift</div>
                <div class="team-count">${job.prtDag}</div>
            </div>
        ` : ''}
        ${job.prt > 0 ? `
            <div class="team-assignment">
                <div class="team-name">Portuguese Evening</div>
                <div class="team-count">${job.prt}</div>
            </div>
        ` : ''}
        ${job.pl > 0 ? `
            <div class="team-assignment">
                <div class="team-name">Polish Evening</div>
                <div class="team-count">${job.pl}</div>
            </div>
        ` : ''}
        ${job.metr > 0 ? `
            <div class="team-assignment">
                <div class="team-name">Metrica Evening</div>
                <div class="team-count">${job.metr}</div>
            </div>
        ` : ''}
    `;
    
    // Render remarks
    document.getElementById('remarksBox').textContent = job.remarks || 'No remarks';
    
    // Render tasks
    renderTasksList(job.tasks, jobId);
    
    // Render team links
    const teams = data.teams.filter(team => 
        job.tasks.some(task => task.assignedTo === team.id)
    );
    
    document.getElementById('teamLinks').innerHTML = teams.map(team => `
        <div class="team-link" onclick="navigateToTeam('${team.id}', '${jobId}')">
            <span class="team-link-name">${team.fullName}</span>
            <span class="team-link-arrow">→</span>
        </div>
    `).join('');
}

function renderTasksList(tasks, jobId) {
    const container = document.getElementById('tasksList');
    
    if (tasks.length === 0) {
        container.innerHTML = '<div class="photo-empty">No tasks found</div>';
        return;
    }
    
    container.innerHTML = tasks.map(task => {
        const team = appData.teams.find(t => t.id === task.assignedTo);
        return `
            <div class="task-card status-${task.status}" onclick="navigateToTask('${task.id}', '${jobId}')">
                <div class="task-header">
                    <div class="task-description">${task.description}</div>
                    <span class="status-badge ${task.status}">${task.status.replace('-', ' ')}</span>
                </div>
                <div class="task-meta">
                    <span class="task-meta-item">👥 ${team ? team.name : task.assignedTo}</span>
                    ${task.photos && task.photos.length > 0 ? `<span class="task-meta-item">📸 ${task.photos.length}</span>` : ''}
                    ${task.notes && task.notes.length > 0 ? `<span class="task-meta-item">📝 ${task.notes.length}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function navigateToTeam(teamId, jobId) {
    window.location.href = `welder.html?team=${teamId}&job=${jobId}`;
}

function navigateToTask(taskId, jobId) {
    window.location.href = `task.html?id=${taskId}&job=${jobId}`;
}

// TEAM VIEW FUNCTIONS
async function loadTeamView(teamId, jobId) {
    const data = await loadData();
    if (!data) return;
    
    const team = data.teams.find(t => t.id === teamId);
    if (!team) {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('teamTitle').textContent = team.fullName;
    
    // Get all tasks for this team
    let allTasks = [];
    data.jobs.forEach(job => {
        job.tasks.forEach(task => {
            if (task.assignedTo === teamId) {
                allTasks.push({
                    ...task,
                    jobId: job.id,
                    orderNumber: job.orderNumber,
                    hal: job.hal,
                    plaats: job.plaats,
                    priority: job.priority
                });
            }
        });
    });
    
    // If filtering by specific job
    if (jobId) {
        allTasks = allTasks.filter(task => task.jobId === jobId);
        const job = data.jobs.find(j => j.id === jobId);
        if (job) {
            document.getElementById('teamSubtitle').textContent = `Job: ${job.orderNumber}`;
        }
    }
    
    // Update stats
    document.getElementById('teamTaskCount').textContent = allTasks.length;
    const uniqueJobs = new Set(allTasks.map(t => t.jobId));
    document.getElementById('teamJobCount').textContent = uniqueJobs.size;
    
    // Render tasks
    renderTeamTasks(allTasks);
    
    // Setup sorting
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        const sortBy = e.target.value;
        const sorted = [...allTasks];
        
        switch(sortBy) {
            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
            case 'order':
                sorted.sort((a, b) => a.orderNumber.localeCompare(b.orderNumber));
                break;
            case 'location':
                sorted.sort((a, b) => a.hal.localeCompare(b.hal));
                break;
            case 'status':
                const statusOrder = { 'in-progress': 0, pending: 1, completed: 2 };
                sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
                break;
        }
        
        renderTeamTasks(sorted);
    });
}

function renderTeamTasks(tasks) {
    const container = document.getElementById('teamTasksList');
    
    if (tasks.length === 0) {
        container.innerHTML = '<div class="photo-empty">No tasks assigned to this team</div>';
        return;
    }
    
    container.innerHTML = tasks.map(task => `
        <div class="task-card status-${task.status}" onclick="navigateToTask('${task.id}', '${task.jobId}')">
            <div class="task-header">
                <div class="task-description">${task.description}</div>
                <span class="status-badge ${task.status}">${task.status.replace('-', ' ')}</span>
            </div>
            <div class="job-detail-item" style="margin-top: 0.5rem;">
                <div class="job-detail-label">Job: ${task.orderNumber}</div>
                <div class="job-detail-value">${task.hal} - ${task.plaats}</div>
            </div>
            <div class="task-meta">
                <span class="task-meta-item">
                    <span class="priority-badge ${task.priority}" style="display: inline-block;">${task.priority}</span>
                </span>
                ${task.photos && task.photos.length > 0 ? `<span class="task-meta-item">📸 ${task.photos.length}</span>` : ''}
                ${task.notes && task.notes.length > 0 ? `<span class="task-meta-item">📝 ${task.notes.length}</span>` : ''}
            </div>
        </div>
    `).join('');
}

// TASK DETAIL FUNCTIONS
async function loadTaskDetails(taskId, jobId) {
    const data = await loadData();
    if (!data) return;
    
    const job = data.jobs.find(j => j.id === jobId);
    if (!job) {
        window.location.href = 'index.html';
        return;
    }
    
    const task = job.tasks.find(t => t.id === taskId);
    if (!task) {
        window.location.href = `job.html?id=${jobId}`;
        return;
    }
    
    // Store current task and job for later use
    currentTaskId = taskId;
    currentJobId = jobId;
    
    // Set title
    document.getElementById('taskTitle').textContent = task.description;
    
    // Render task details
    const team = data.teams.find(t => t.id === task.assignedTo);
    document.getElementById('taskDetails').innerHTML = `
        <div class="task-detail-row">
            <span class="task-detail-label">Job</span>
            <span class="task-detail-value">${job.orderNumber}</span>
        </div>
        <div class="task-detail-row">
            <span class="task-detail-label">Location</span>
            <span class="task-detail-value">${job.hal} - ${job.plaats}</span>
        </div>
        <div class="task-detail-row">
            <span class="task-detail-label">Phase</span>
            <span class="task-detail-value">${job.fase}</span>
        </div>
        <div class="task-detail-row">
            <span class="task-detail-label">Drawing</span>
            <span class="task-detail-value">${job.tekMerk}</span>
        </div>
        <div class="task-detail-row">
            <span class="task-detail-label">Assigned To</span>
            <span class="task-detail-value">${team ? team.fullName : task.assignedTo}</span>
        </div>
        <div class="task-detail-row">
            <span class="task-detail-label">Status</span>
            <span class="task-detail-value">
                <span class="status-badge ${task.status}">${task.status.replace('-', ' ')}</span>
            </span>
        </div>
    `;
    
    // Load photos from backend
    loadTaskPhotos();
    
    // Render notes
    renderNotes(task.notes || []);
    
    // Update status buttons
    document.querySelectorAll('.status-btn').forEach(btn => {
        if (btn.dataset.status === task.status) {
            btn.classList.add('active');
        }
    });
}

function renderPhotos(photos) {
    const container = document.getElementById('photoGallery');
    
    if (photos.length === 0) {
        container.innerHTML = '<div class="photo-empty">No photos yet. Take a photo to get started!</div>';
        return;
    }
    
    container.innerHTML = photos.map((photo, index) => `
        <div class="photo-item" onclick="openPhotoModal(${index})">
            <img src="${photo.data}" alt="Task photo ${index + 1}">
            ${photo.caption ? `<div class="photo-caption">${photo.caption}</div>` : ''}
        </div>
    `).join('');
}

function renderNotes(notes) {
    const container = document.getElementById('notesList');
    
    if (notes.length === 0) {
        container.innerHTML = '<div class="notes-empty">No notes yet</div>';
        return;
    }
    
    container.innerHTML = notes.map(note => `
        <div class="note-item">
            <div class="note-header">
                <span class="note-author">Team Member</span>
                <span class="note-time">${new Date(note.timestamp).toLocaleString()}</span>
            </div>
            <div class="note-content">${note.content}</div>
        </div>
    `).join('');
}

// PHOTO FUNCTIONS
async function handlePhotoUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Upload each file to the backend
    for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
            try {
                await TaskAPI.uploadPhoto(currentTaskId, file, '');
                console.log('Photo uploaded successfully');
            } catch (error) {
                console.error('Failed to upload photo:', error);
                alert('Failed to upload photo. Please try again.');
            }
        }
    }
    
    // Reload photos after upload
    await loadTaskPhotos();
    
    // Clear the input
    event.target.value = '';
}

async function loadTaskPhotos() {
    if (!currentTaskId) return;
    
    try {
        const photos = await TaskAPI.getPhotos(currentTaskId);
        const job = appData.jobs.find(j => j.id === currentJobId);
        const task = job.tasks.find(t => t.id === currentTaskId);
        
        // Update local data with photos from backend
        task.photos = photos.map(photo => ({
            id: photo.id,
            data: photo.path,
            caption: photo.caption,
            timestamp: photo.createdAt
        }));
        
        renderPhotos(task.photos);
    } catch (error) {
        console.error('Failed to load photos:', error);
        renderPhotos([]);
    }
}

function openPhotoModal(index) {
    currentPhotoIndex = index;
    
    const job = appData.jobs.find(j => j.id === currentJobId);
    const task = job.tasks.find(t => t.id === currentTaskId);
    const photo = task.photos[index];
    
    const modal = document.getElementById('photoModal');
    const img = document.getElementById('modalImage');
    const captionInput = document.getElementById('photoCaptionInput');
    
    img.src = photo.data;
    captionInput.value = photo.caption || '';
    
    modal.classList.add('active');
}

function closePhotoModal() {
    document.getElementById('photoModal').classList.remove('active');
    currentPhotoIndex = null;
}

async function savePhotoCaption() {
    if (currentPhotoIndex === null) return;
    
    const job = appData.jobs.find(j => j.id === currentJobId);
    const task = job.tasks.find(t => t.id === currentTaskId);
    const photo = task.photos[currentPhotoIndex];
    const caption = document.getElementById('photoCaptionInput').value;
    
    try {
        await TaskAPI.updatePhotoCaption(photo.id, caption);
        photo.caption = caption;
        renderPhotos(task.photos);
        closePhotoModal();
    } catch (error) {
        console.error('Failed to update caption:', error);
        alert('Failed to update caption. Please try again.');
    }
}

async function deletePhoto() {
    if (currentPhotoIndex === null) return;
    
    if (!confirm('Are you sure you want to delete this photo?')) return;
    
    const job = appData.jobs.find(j => j.id === currentJobId);
    const task = job.tasks.find(t => t.id === currentTaskId);
    const photo = task.photos[currentPhotoIndex];
    
    try {
        await TaskAPI.deletePhoto(photo.id);
        task.photos.splice(currentPhotoIndex, 1);
        renderPhotos(task.photos);
        closePhotoModal();
    } catch (error) {
        console.error('Failed to delete photo:', error);
        alert('Failed to delete photo. Please try again.');
    }
}

// NOTES FUNCTIONS
function addNote() {
    const noteInput = document.getElementById('noteInput');
    const content = noteInput.value.trim();
    
    if (!content) return;
    
    const job = appData.jobs.find(j => j.id === currentJobId);
    const task = job.tasks.find(t => t.id === currentTaskId);
    
    if (!task.notes) {
        task.notes = [];
    }
    
    task.notes.push({
        content: content,
        timestamp: new Date().toISOString()
    });
    
    saveData();
    renderNotes(task.notes);
    noteInput.value = '';
}

// STATUS UPDATE FUNCTION
function updateTaskStatus(newStatus) {
    const job = appData.jobs.find(j => j.id === currentJobId);
    const task = job.tasks.find(t => t.id === currentTaskId);
    
    task.status = newStatus;
    
    // Update button states
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.status === newStatus) {
            btn.classList.add('active');
        }
    });
    
    saveData();
    
    // Show feedback
    const statusBadge = document.querySelector('.task-detail-card .status-badge');
    if (statusBadge) {
        statusBadge.className = `status-badge ${newStatus}`;
        statusBadge.textContent = newStatus.replace('-', ' ');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('photoModal');
    if (event.target === modal) {
        closePhotoModal();
    }
}
