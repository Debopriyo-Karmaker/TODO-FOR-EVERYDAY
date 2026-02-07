// ===========================
// State
// ===========================

let tasks = [];
let editingTaskId = null;
let searchQuery = '';

// ===========================
// DOM Elements
// ===========================

const elements = {
    taskInput: null,
    dateInput: null,
    addTaskForm: null,
    tasksContainer: null,
    searchInput: null
};

// ===========================
// Initialize
// ===========================

function init() {
    console.log('🚀 Initializing TODO App...');

    // Cache DOM elements
    elements.taskInput = document.getElementById('taskInput');
    elements.dateInput = document.getElementById('dateInput');
    elements.addTaskForm = document.getElementById('addTaskForm');
    elements.tasksContainer = document.getElementById('tasksContainer');
    elements.searchInput = document.getElementById('searchInput');

    // Load saved data
    loadTasks();

    // Render initial state
    renderTasks();

    // Event listeners
    elements.addTaskForm.addEventListener('submit', handleAddTask);
    elements.searchInput.addEventListener('input', handleSearch);
    document.addEventListener('keydown', handleGlobalKeyboard);

    // Handle date input placeholder
    const dateWrapper = elements.dateInput.parentElement;
    elements.dateInput.addEventListener('change', () => {
        if (elements.dateInput.value) {
            dateWrapper.classList.add('has-value');
            elements.dateInput.classList.add('has-value');
        } else {
            dateWrapper.classList.remove('has-value');
            elements.dateInput.classList.remove('has-value');
        }
    });

    // Initialize date input state
    if (elements.dateInput.value) {
        dateWrapper.classList.add('has-value');
        elements.dateInput.classList.add('has-value');
    }

    console.log('✅ App initialized successfully');
}

// ===========================
// Task Management
// ===========================

function handleAddTask(e) {
    e.preventDefault();

    const text = elements.taskInput.value.trim();
    const date = elements.dateInput.value;

    if (!text) return;

    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        starred: false,
        date: date || null,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(task);
    saveTasks();
    renderTasks();

    // Reset form
    elements.taskInput.value = '';
    elements.dateInput.value = '';
    elements.taskInput.focus();

    // Reset date input placeholder
    const dateWrapper = elements.dateInput.parentElement;
    dateWrapper.classList.remove('has-value');
    elements.dateInput.classList.remove('has-value');

    console.log('✅ Task added:', task);
}

function toggleTaskComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        console.log('✅ Task toggled:', taskId, 'completed:', task.completed);
    }
}

function toggleTaskStar(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.starred = !task.starred;
        saveTasks();
        renderTasks();
        console.log('⭐ Task starred:', taskId, 'starred:', task.starred);
    }
}

function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderTasks();
    console.log('🗑️ Task deleted:', taskId);
}

function startEditTask(taskId) {
    editingTaskId = taskId;
    renderTasks();

    // Focus the edit input
    setTimeout(() => {
        const editInput = document.querySelector(`#edit-input-${taskId}`);
        if (editInput) {
            editInput.focus();
            editInput.select();
        }
    }, 0);
}

function saveEditTask(taskId, newText) {
    const task = tasks.find(t => t.id === taskId);
    if (task && newText.trim()) {
        task.text = newText.trim();
        editingTaskId = null;
        saveTasks();
        renderTasks();
        console.log('✅ Task edited:', taskId);
    } else {
        cancelEdit();
    }
}

function cancelEdit() {
    editingTaskId = null;
    renderTasks();
}

// ===========================
// Render
// ===========================

function renderTasks() {
    const filteredTasks = filterTasks();

    if (filteredTasks.length === 0) {
        elements.tasksContainer.innerHTML = `
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <p class="empty-state-text">${searchQuery ? 'No tasks found' : 'No tasks yet. Add one to get started!'}</p>
            </div>
        `;
        return;
    }

    // Group tasks by date
    const groupedTasks = groupTasksByDate(filteredTasks);

    let html = '';

    // Today's tasks
    if (groupedTasks.today.length > 0) {
        html += renderTaskSection('Today', groupedTasks.today, 'today-badge', '🔥');
    }

    // Tomorrow's tasks
    if (groupedTasks.tomorrow.length > 0) {
        html += renderTaskSection('Tomorrow', groupedTasks.tomorrow, 'tomorrow-badge', '📅');
    }

    // Later tasks
    if (groupedTasks.later.length > 0) {
        html += renderTaskSection('Later', groupedTasks.later, 'later-badge', '📆');
    }

    elements.tasksContainer.innerHTML = html;
}

function renderTaskSection(title, tasks, badgeClass, emoji) {
    return `
        <div class="tasks-section">
            <div class="section-header">
                <h2 class="section-title">
                    <span>${emoji}</span>
                    ${title}
                </h2>
                <span class="section-badge ${badgeClass}">${tasks.length}</span>
            </div>
            <div class="task-list">
                ${tasks.map(task => renderTask(task)).join('')}
            </div>
        </div>
    `;
}

function renderTask(task) {
    const isEditing = editingTaskId === task.id;

    if (isEditing) {
        return `
            <div class="task-item" data-task-id="${task.id}">
                <input
                    type="text"
                    class="edit-input"
                    id="edit-input-${task.id}"
                    value="${escapeHtml(task.text)}"
                    onkeydown="handleEditKeydown(event, ${task.id}, this.value)"
                >
                <div class="edit-actions">
                    <button class="save-btn" onclick="saveEditTask(${task.id}, document.getElementById('edit-input-${task.id}').value)">
                        Save
                    </button>
                    <button class="cancel-btn" onclick="cancelEdit()">
                        Cancel
                    </button>
                </div>
            </div>
        `;
    }

    return `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTaskComplete(${task.id})"></div>

            <div class="task-content">
                <div class="task-text">${escapeHtml(task.text)}</div>
                ${task.date ? `
                    <div class="task-meta">
                        <span class="task-date">
                            <svg class="date-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            ${formatDate(task.date)}
                        </span>
                    </div>
                ` : ''}
            </div>

            <div class="task-actions">
                <button class="task-btn star-btn ${task.starred ? 'starred' : ''}" onclick="toggleTaskStar(${task.id})" title="Star task">
                    <svg class="icon" fill="${task.starred ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                </button>

                <button class="task-btn edit-btn" onclick="startEditTask(${task.id})" title="Edit task">
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                </button>

                <button class="task-btn delete-btn" onclick="deleteTask(${task.id})" title="Delete task">
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

// ===========================
// Task Grouping
// ===========================

function groupTasksByDate(tasks) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const grouped = {
        today: [],
        tomorrow: [],
        later: []
    };

    // Sort: starred first, then by date, then by creation time
    const sortedTasks = [...tasks].sort((a, b) => {
        // Starred tasks first
        if (a.starred && !b.starred) return -1;
        if (!a.starred && b.starred) return 1;

        // Then by date
        if (a.date && b.date) {
            return new Date(a.date) - new Date(b.date);
        }
        if (a.date && !b.date) return -1;
        if (!a.date && b.date) return 1;

        // Finally by creation time (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    sortedTasks.forEach(task => {
        if (!task.date) {
            grouped.later.push(task);
            return;
        }

        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);

        if (taskDate.getTime() === today.getTime()) {
            grouped.today.push(task);
        } else if (taskDate.getTime() === tomorrow.getTime()) {
            grouped.tomorrow.push(task);
        } else {
            grouped.later.push(task);
        }
    });

    return grouped;
}

// ===========================
// Utilities
// ===========================

function formatDate(dateString) {
    const date = new Date(dateString);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate.getTime() === today.getTime()) {
        return 'Today';
    } else if (targetDate.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
    } else {
        const options = { month: 'short', day: 'numeric' };
        const formattedDate = date.toLocaleDateString('en-US', options);

        // Add year if not current year
        if (date.getFullYear() !== today.getFullYear()) {
            return formattedDate + ', ' + date.getFullYear();
        }

        return formattedDate;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function filterTasks() {
    if (!searchQuery) return tasks;

    const query = searchQuery.toLowerCase();
    return tasks.filter(task =>
        task.text.toLowerCase().includes(query)
    );
}

// ===========================
// Search
// ===========================

function handleSearch(e) {
    searchQuery = e.target.value.trim();
    renderTasks();
}

// ===========================
// Keyboard Shortcuts
// ===========================

function handleGlobalKeyboard(e) {
    // Escape to cancel edit
    if (e.key === 'Escape' && editingTaskId !== null) {
        cancelEdit();
    }
}

function handleEditKeydown(e, taskId, value) {
    if (e.key === 'Enter') {
        e.preventDefault();
        saveEditTask(taskId, value);
    } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
    }
}

// Dark mode removed - light mode only

// ===========================
// Local Storage
// ===========================

function saveTasks() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        console.log('💾 Tasks saved:', tasks.length, 'tasks');
    } catch (e) {
        console.error('❌ Error saving tasks:', e);
    }
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
            console.log('📥 Tasks loaded:', tasks.length, 'tasks');
        } catch (e) {
            console.error('❌ Error loading tasks:', e);
            tasks = [];
        }
    } else {
        console.log('ℹ️ No saved tasks found');
    }
}

// ===========================
// Interactive Tile Background
// ===========================

class TileBackground {
    constructor() {
        this.canvas = document.getElementById('tileBackground');
        this.ctx = this.canvas.getContext('2d');
        this.tiles = [];

        // Mobile detection
        this.isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

        // Optimize tile size for mobile
        this.tileSize = this.isMobile ? 150 : 120;
        this.gap = this.isMobile ? 25 : 20;

        this.mouseX = -1000;
        this.mouseY = -1000;
        this.touchX = -1000;
        this.touchY = -1000;

        // FPS throttling for mobile
        this.targetFPS = this.isMobile ? 30 : 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.lastFrameTime = 0;

        // Visibility state
        this.isVisible = true;

        this.init();
    }

    init() {
        this.resize();
        this.createTiles();
        this.attachEvents();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        const effectiveSize = this.tileSize + this.gap;
        this.cols = Math.ceil(this.canvas.width / effectiveSize) + 2;
        this.rows = Math.ceil(this.canvas.height / effectiveSize) + 2;
    }

    createTiles() {
        this.tiles = [];
        const effectiveSize = this.tileSize + this.gap;

        for (let row = -1; row < this.rows; row++) {
            for (let col = -1; col < this.cols; col++) {
                this.tiles.push({
                    x: col * effectiveSize,
                    y: row * effectiveSize,
                    baseX: col * effectiveSize,
                    baseY: row * effectiveSize,
                    offsetX: 0,
                    offsetY: 0,
                    offsetZ: 0,
                    scale: 1,
                    rotation: 0,
                    color: this.getRandomTileColor(),
                    shadow: this.getRandomShadow()
                });
            }
        }
    }

    getRandomTileColor() {
        const colors = [
            'rgba(255, 255, 255, 0.9)',
            'rgba(255, 255, 255, 0.85)',
            'rgba(245, 243, 255, 0.95)',
            'rgba(237, 233, 254, 0.9)'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getRandomShadow() {
        const shadows = [
            { blur: 20, offsetY: 8, alpha: 0.1 },
            { blur: 25, offsetY: 10, alpha: 0.12 },
            { blur: 30, offsetY: 12, alpha: 0.08 }
        ];
        return shadows[Math.floor(Math.random() * shadows.length)];
    }

    attachEvents() {
        // Debounced resize for better performance
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resize();
                this.createTiles();
            }, 150);
        });

        // Only track mouse on desktop
        if (!this.isMobile) {
            window.addEventListener('mousemove', (e) => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
            });

            window.addEventListener('mouseleave', () => {
                this.mouseX = -1000;
                this.mouseY = -1000;
            });
        }

        // Touch events for mobile
        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                this.touchX = e.touches[0].clientX;
                this.touchY = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.touchX = e.touches[0].clientX;
                this.touchY = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            this.touchX = -1000;
            this.touchY = -1000;
        }, { passive: true });

        // Pause animation when tab is hidden
        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
        });
    }

    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    animate(currentTime = 0) {
        // Skip frame if not visible
        if (!this.isVisible) {
            requestAnimationFrame((time) => this.animate(time));
            return;
        }

        // FPS throttling
        const elapsed = currentTime - this.lastFrameTime;
        if (elapsed < this.frameInterval) {
            requestAnimationFrame((time) => this.animate(time));
            return;
        }
        this.lastFrameTime = currentTime - (elapsed % this.frameInterval);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const interactX = this.touchX !== -1000 ? this.touchX : this.mouseX;
        const interactY = this.touchY !== -1000 ? this.touchY : this.mouseY;

        this.tiles.forEach(tile => {
            const centerX = tile.baseX + this.tileSize / 2;
            const centerY = tile.baseY + this.tileSize / 2;
            const dx = interactX - centerX;
            const dy = interactY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 250;

            if (distance < maxDistance) {
                const force = (maxDistance - distance) / maxDistance;
                const angle = Math.atan2(dy, dx);

                // Move away from cursor
                tile.offsetX += Math.cos(angle) * force * -15;
                tile.offsetY += Math.sin(angle) * force * -15;

                // Add 3D lift effect
                tile.offsetZ = force * 30;

                // Scale up slightly
                tile.scale = 1 + force * 0.15;

                // Subtle rotation based on position
                tile.rotation = force * Math.sin(angle) * 0.08;
            }

            // Spring back to original position
            tile.offsetX *= 0.88;
            tile.offsetY *= 0.88;
            tile.offsetZ *= 0.88;
            tile.scale += (1 - tile.scale) * 0.12;
            tile.rotation *= 0.88;

            // Calculate final position
            const finalX = tile.baseX + tile.offsetX;
            const finalY = tile.baseY + tile.offsetY;

            // Draw shadow (enhanced with Z offset)
            this.ctx.save();
            const shadowOffset = tile.shadow.offsetY + tile.offsetZ * 0.5;
            const shadowBlur = tile.shadow.blur + tile.offsetZ * 0.3;
            const shadowAlpha = tile.shadow.alpha * (1 + tile.offsetZ / 50);

            this.ctx.shadowColor = `rgba(139, 92, 246, ${shadowAlpha})`;
            this.ctx.shadowBlur = shadowBlur;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = shadowOffset;

            // Draw tile
            this.ctx.translate(finalX + this.tileSize / 2, finalY + this.tileSize / 2);
            this.ctx.rotate(tile.rotation);
            this.ctx.scale(tile.scale, tile.scale);

            this.ctx.fillStyle = tile.color;
            this.drawRoundedRect(
                -this.tileSize / 2,
                -this.tileSize / 2,
                this.tileSize,
                this.tileSize,
                20
            );
            this.ctx.fill();

            // Add subtle gradient overlay for depth
            const gradient = this.ctx.createLinearGradient(
                -this.tileSize / 2,
                -this.tileSize / 2,
                this.tileSize / 2,
                this.tileSize / 2
            );

            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0.02)');

            this.ctx.fillStyle = gradient;
            this.drawRoundedRect(
                -this.tileSize / 2,
                -this.tileSize / 2,
                this.tileSize,
                this.tileSize,
                20
            );
            this.ctx.fill();

            this.ctx.restore();
        });

        requestAnimationFrame((time) => this.animate(time));
    }
}

// ===========================
// Initialize on Load
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    window.tileBackground = new TileBackground();
    init();
});
