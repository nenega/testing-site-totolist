// Todo List Application

class TodoApp {
    constructor() {
        this.token = localStorage.getItem('authToken') || '';
        this.user = null;

        this.sections = [];

        this.logoutBtn = document.getElementById('logoutBtn');
        this.authStatusEl = document.getElementById('authStatus');

        this.sectionEls = Array.from(document.querySelectorAll('.todo-section'));
        this.sections = this.sectionEls.map(el => this.createSection(el));
        
        this.attachEventListeners();
        this.refreshAuthState();
    }
    
    attachEventListeners() {
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.logout());
        }

        this.sections.forEach(section => {
            section.addBtn.addEventListener('click', () => this.addTask(section));
            section.taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addTask(section);
            });

            section.filterButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    section.filterButtons.forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    section.currentFilter = e.target.dataset.filter;
                    this.renderSection(section);
                });
            });

            section.clearCompletedBtn.addEventListener('click', () => this.clearCompleted(section));
        });
    }

    createSection(el) {
        const category = el.dataset.category;
        const taskInput = el.querySelector('.taskInput');
        const addBtn = el.querySelector('.addBtn');
        const taskList = el.querySelector('.taskList');
        const clearCompletedBtn = el.querySelector('.clearCompleted');
        const filterButtons = Array.from(el.querySelectorAll('.filter-btn'));
        const totalCountEl = el.querySelector('.totalCount');
        const completedCountEl = el.querySelector('.completedCount');

        return {
            el,
            category,
            tasks: [],
            currentFilter: 'all',
            taskInput,
            addBtn,
            taskList,
            clearCompletedBtn,
            filterButtons,
            totalCountEl,
            completedCountEl
        };
    }

    async apiRequest(path, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        const res = await fetch(path, {
            ...options,
            headers
        });

        const contentType = res.headers.get('content-type') || '';
        const body = contentType.includes('application/json') ? await res.json() : null;

        if (!res.ok) {
            const error = body?.error || 'request_failed';
            throw new Error(error);
        }

        return body;
    }

    setAuthStatus(text) {
        if (!this.authStatusEl) return;
        this.authStatusEl.textContent = text || '';
    }

    setTodoEnabled(enabled) {
        const isEnabled = Boolean(enabled);

        this.sections.forEach(section => {
            section.taskInput.disabled = !isEnabled;
            section.addBtn.disabled = !isEnabled;
            section.clearCompletedBtn.disabled = !isEnabled;

            section.filterButtons.forEach(btn => {
                btn.disabled = !isEnabled;
                btn.style.opacity = isEnabled ? '1' : '0.6';
            });

            section.taskInput.placeholder = isEnabled
                ? 'Добавьте новую задачу...'
                : 'Войдите, чтобы добавлять задачи';
        });
    }

    setAuthUiState() {
        const loggedIn = Boolean(this.user);
        if (this.logoutBtn) {
            this.logoutBtn.style.display = loggedIn ? 'inline-block' : 'none';
        }

        if (loggedIn) {
            this.setAuthStatus(`Вы вошли как: ${this.user.username}`);
        } else {
            this.setAuthStatus('');
        }
    }

    async refreshAuthState() {
        if (!this.token) {
            window.location.href = '/login.html';
            return;
        }

        try {
            const data = await this.apiRequest('/api/me', { method: 'GET' });
            this.user = data.user;
            this.sections.forEach(section => {
                section.tasks = this.loadFromStorage(section.category);
            });
            this.setTodoEnabled(true);
            this.setAuthUiState();
            this.sections.forEach(section => this.renderSection(section));
        } catch {
            this.token = '';
            localStorage.removeItem('authToken');
            window.location.href = '/login.html';
        }
    }

    logout() {
        this.token = '';
        localStorage.removeItem('authToken');
        this.user = null;
        window.location.href = '/';
    }

    addTask(section) {
        if (!this.user) {
            this.setAuthStatus('Сначала выполните вход');
            return;
        }

        const text = section.taskInput.value.trim();
        
        if (!text) {
            alert('Пожалуйста, введите текст задачи');
            return;
        }
        
        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        section.tasks.push(task);
        section.taskInput.value = '';
        section.taskInput.focus();
        this.saveToStorage(section.category, section.tasks);
        this.renderSection(section);
    }

    deleteTask(section, id) {
        if (!this.user) return;
        section.tasks = section.tasks.filter(task => task.id !== id);
        this.saveToStorage(section.category, section.tasks);
        this.renderSection(section);
    }

    toggleTask(section, id) {
        if (!this.user) return;
        const task = section.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveToStorage(section.category, section.tasks);
            this.renderSection(section);
        }
    }

    clearCompleted(section) {
        if (!this.user) return;
        const hasCompleted = section.tasks.some(t => t.completed);
        if (!hasCompleted) {
            alert('Нет выполненных задач для удаления');
            return;
        }
        
        if (confirm('Вы уверены, что хотите удалить все выполненные задачи?')) {
            section.tasks = section.tasks.filter(task => !task.completed);
            this.saveToStorage(section.category, section.tasks);
            this.renderSection(section);
        }
    }

    getFilteredTasks(section) {
        switch (section.currentFilter) {
            case 'active':
                return section.tasks.filter(t => !t.completed);
            case 'completed':
                return section.tasks.filter(t => t.completed);
            default:
                return section.tasks;
        }
    }

    updateStats(section) {
        const total = section.tasks.length;
        const completed = section.tasks.filter(t => t.completed).length;

        section.totalCountEl.textContent = total;
        section.completedCountEl.textContent = completed;
    }

    renderSection(section) {
        const filteredTasks = this.getFilteredTasks(section);
        section.taskList.innerHTML = '';

        if (filteredTasks.length === 0) {
            section.taskList.innerHTML = '<div class="empty-state">Нет задач</div>';
        } else {
            filteredTasks.forEach(task => {
                const li = document.createElement('li');
                li.className = `task-item ${task.completed ? 'completed' : ''}`;
                
                li.innerHTML = `
                    <input 
                        type="checkbox" 
                        class="task-checkbox"
                        ${task.completed ? 'checked' : ''}
                    >
                    <span class="task-text">${this.escapeHtml(task.text)}</span>
                    <button class="delete-btn">Удалить</button>
                `;
                
                const checkbox = li.querySelector('.task-checkbox');
                const deleteBtn = li.querySelector('.delete-btn');

                checkbox.addEventListener('change', () => this.toggleTask(section, task.id));
                deleteBtn.addEventListener('click', () => this.deleteTask(section, task.id));

                section.taskList.appendChild(li);
            });
        }

        this.updateStats(section);
    }

    saveToStorage(category, tasks) {
        if (!this.user) return;
        localStorage.setItem(`todoTasks:${this.user.username}:${category}`, JSON.stringify(tasks));
    }

    loadFromStorage(category) {
        if (!this.user) return [];
        const stored = localStorage.getItem(`todoTasks:${this.user.username}:${category}`);
        return stored ? JSON.parse(stored) : [];
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
