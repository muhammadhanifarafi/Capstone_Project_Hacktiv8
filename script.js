document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const totalTasks = document.getElementById('totalTasks');
    const completedTasks = document.getElementById('completedTasks');
    const pendingTasks = document.getElementById('pendingTasks');
    const progressPercent = document.getElementById('progressPercent');
    const charCount = document.getElementById('charCount');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const clearAllBtn = document.getElementById('clearAll');

    // Filter buttons
    const showAllBtn = document.getElementById('showAll');
    const showPendingBtn = document.getElementById('showPending');
    const showCompletedBtn = document.getElementById('showCompleted');
    const showPriorityBtn = document.getElementById('showPriority');

    // Modal elements
    const priorityModal = document.getElementById('priorityModal');
    const editModal = document.getElementById('editModal');
    const editTaskInput = document.getElementById('editTaskInput');
    const saveEditBtn = document.getElementById('saveEdit');
    const cancelEditBtn = document.getElementById('cancelEdit');
    const closePriorityModalBtn = document.getElementById('closePriorityModal');

    // State variables
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let searchQuery = '';
    let editingTaskId = null;
    let selectedTaskForPriority = null;

    // Initialize the app
    function init() {
        renderTasks();
        updateStats();
        setupEventListeners();
        setupCharacterCounter();
        setupSearch();
        setupModals();
    }

    // Setup all event listeners
    function setupEventListeners() {
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTask();
            }
        });
        
        clearCompletedBtn.addEventListener('click', clearCompleted);
        clearAllBtn.addEventListener('click', clearAll);
        
        // Filter event listeners
        showAllBtn.addEventListener('click', () => setFilter('all'));
        showPendingBtn.addEventListener('click', () => setFilter('pending'));
        showCompletedBtn.addEventListener('click', () => setFilter('completed'));
        showPriorityBtn.addEventListener('click', () => setFilter('priority'));
    }

    // Setup character counter
    function setupCharacterCounter() {
        taskInput.addEventListener('input', () => {
            const count = taskInput.value.length;
            charCount.textContent = count;
            
            if (count > 80) {
                charCount.style.color = '#dc3545';
            } else if (count > 60) {
                charCount.style.color = '#ffc107';
            } else {
                charCount.style.color = '#6c757d';
            }
        });
    }

    // Setup search functionality
    function setupSearch() {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderTasks();
        });
        
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            renderTasks();
        });
    }

    // Setup modals
    function setupModals() {
        // Priority modal
        closePriorityModalBtn.addEventListener('click', () => {
            priorityModal.style.display = 'none';
        });

        // Edit modal
        saveEditBtn.addEventListener('click', saveEdit);
        cancelEditBtn.addEventListener('click', () => {
            editModal.style.display = 'none';
            editingTaskId = null;
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === priorityModal) {
                priorityModal.style.display = 'none';
            }
            if (e.target === editModal) {
                editModal.style.display = 'none';
                editingTaskId = null;
            }
        });

        // Priority buttons
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const priority = btn.dataset.priority;
                if (selectedTaskForPriority) {
                    setTaskPriority(selectedTaskForPriority, priority);
                    priorityModal.style.display = 'none';
                    selectedTaskForPriority = null;
                }
            });
        });
    }

    // Add new task
    function addTask() {
        const taskText = taskInput.value.trim();

        if (taskText === '') {
            showNotification('Silakan masukkan teks tugas!', 'error');
            return;
        }

        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            priority: 'medium',
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        updateStats();
        
        taskInput.value = '';
        charCount.textContent = '0';
        charCount.style.color = '#6c757d';
        taskInput.focus();
        
        showNotification('Tugas berhasil ditambahkan!', 'success');
    }

    // Toggle task completion
    function toggleTask(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            saveTasks();
            renderTasks();
            updateStats();
        }
    }

    // Edit task
    function editTask(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            editingTaskId = id;
            editTaskInput.value = task.text;
            editModal.style.display = 'block';
            editTaskInput.focus();
        }
    }

    // Save edit
    function saveEdit() {
        if (editingTaskId) {
            const newText = editTaskInput.value.trim();
            if (newText !== '') {
                const task = tasks.find(t => t.id === editingTaskId);
                if (task) {
                    task.text = newText;
                    saveTasks();
                    renderTasks();
                    showNotification('Tugas berhasil diedit!', 'success');
                }
            }
            editModal.style.display = 'none';
            editingTaskId = null;
        }
    }

    // Set task priority
    function setTaskPriority(id, priority) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.priority = priority;
            saveTasks();
            renderTasks();
            showNotification(`Prioritas tugas diubah ke ${priority}`, 'success');
        }
    }

    // Show priority modal
    function showPriorityModal(taskId) {
        selectedTaskForPriority = taskId;
        priorityModal.style.display = 'block';
    }

    // Delete task
    function deleteTask(id) {
        if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
            updateStats();
            showNotification('Tugas berhasil dihapus!', 'success');
        }
    }

    // Clear completed tasks
    function clearCompleted() {
        if (confirm('Apakah Anda yakin ingin menghapus semua tugas yang sudah selesai?')) {
            tasks = tasks.filter(t => !t.completed);
            saveTasks();
            renderTasks();
            updateStats();
            showNotification('Tugas selesai berhasil dihapus!', 'success');
        }
    }

    // Clear all tasks
    function clearAll() {
        if (confirm('Apakah Anda yakin ingin menghapus semua tugas?')) {
            tasks = [];
            saveTasks();
            renderTasks();
            updateStats();
            showNotification('Semua tugas berhasil dihapus!', 'success');
        }
    }

    // Set filter
    function setFilter(filter) {
        currentFilter = filter;
        
        // Update active button
        [showAllBtn, showPendingBtn, showCompletedBtn, showPriorityBtn].forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (filter === 'all') showAllBtn.classList.add('active');
        else if (filter === 'pending') showPendingBtn.classList.add('active');
        else if (filter === 'completed') showCompletedBtn.classList.add('active');
        else if (filter === 'priority') showPriorityBtn.classList.add('active');
        
        renderTasks();
    }

    // Render tasks based on current filter and search
    function renderTasks() {
        taskList.innerHTML = '';
        
        let filteredTasks = tasks;
        
        // Apply search filter
        if (searchQuery) {
            filteredTasks = filteredTasks.filter(task => 
                task.text.toLowerCase().includes(searchQuery)
            );
        }
        
        // Apply status filter
        if (currentFilter === 'pending') {
            filteredTasks = filteredTasks.filter(t => !t.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(t => t.completed);
        } else if (currentFilter === 'priority') {
            filteredTasks = filteredTasks.filter(t => t.priority === 'high');
        }

        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            if (searchQuery) {
                emptyMessage.textContent = `Tidak ada tugas yang cocok dengan "${searchQuery}"`;
            } else {
                emptyMessage.textContent = currentFilter === 'all' ? 'Belum ada tugas' : 
                                         currentFilter === 'pending' ? 'Tidak ada tugas pending' : 
                                         currentFilter === 'completed' ? 'Tidak ada tugas selesai' :
                                         'Tidak ada tugas prioritas tinggi';
            }
            taskList.appendChild(emptyMessage);
            return;
        }

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = task.completed ? 'completed' : '';
            li.dataset.id = task.id;
            li.dataset.priority = task.priority;

            const taskContent = document.createElement('div');
            taskContent.className = 'task-content';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => toggleTask(task.id));
            
            const taskText = document.createElement('span');
            taskText.textContent = task.text;
            taskText.className = 'task-text';
            
            const priorityIndicator = document.createElement('span');
            priorityIndicator.className = `priority-indicator priority-${task.priority}`;
            priorityIndicator.innerHTML = task.priority === 'high' ? '🔴' : 
                                       task.priority === 'medium' ? '🟡' : '🟢';
            priorityIndicator.title = `Prioritas: ${task.priority}`;
            
            taskContent.appendChild(checkbox);
            taskContent.appendChild(taskText);
            taskContent.appendChild(priorityIndicator);
            
            const taskActions = document.createElement('div');
            taskActions.className = 'task-actions';
            
            const priorityBtn = document.createElement('button');
            priorityBtn.innerHTML = '⭐';
            priorityBtn.className = 'action-btn priority-btn';
            priorityBtn.title = 'Ubah prioritas';
            priorityBtn.onclick = () => showPriorityModal(task.id);
            
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '✏️';
            editBtn.className = 'action-btn edit-btn';
            editBtn.title = 'Edit tugas';
            editBtn.onclick = () => editTask(task.id);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.title = 'Hapus tugas';
            deleteBtn.onclick = () => deleteTask(task.id);
            
            taskActions.appendChild(priorityBtn);
            taskActions.appendChild(editBtn);
            taskActions.appendChild(deleteBtn);
            
            li.appendChild(taskContent);
            li.appendChild(taskActions);
            taskList.appendChild(li);
        });
    }

    // Update statistics
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        totalTasks.textContent = total;
        completedTasks.textContent = completed;
        pendingTasks.textContent = pending;
        progressPercent.textContent = `${progress}%`;
    }

    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Close modal function
    function closeModal(element) {
        const modal = element.closest('.modal');
        if (modal) {
            modal.remove();
        }
    }

    // Initialize the app
    init();
});