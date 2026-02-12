// Todo List Application

class TodoApp {
    constructor() {
        this.token = localStorage.getItem('authToken') || '';
        this.user = null;

        this.tasks = [];
        this.currentFilter = 'all';
        
        this.usernameInput = document.getElementById('usernameInput');
        this.passwordInput = document.getElementById('passwordInput');
        this.registerBtn = document.getElementById('registerBtn');
        this.loginBtn = document.getElementById('loginBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.authStatusEl = document.getElementById('authStatus');

        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.totalCountEl = document.getElementById('totalCount');
        this.completedCountEl = document.getElementById('completedCount');
        
        this.attachEventListeners();
        this.refreshAuthState();
    }
    
    attachEventListeners() {
        this.registerBtn.addEventListener('click', () => this.register());
        this.loginBtn.addEventListener('click', () => this.login());
        this.logoutBtn.addEventListener('click', () => this.logout());

        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.render();
            });
        });
        
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
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
        this.taskInput.disabled = !isEnabled;
        this.addBtn.disabled = !isEnabled;
        this.clearCompletedBtn.disabled = !isEnabled;

        this.filterButtons.forEach(btn => {
            btn.disabled = !isEnabled;
            btn.style.opacity = isEnabled ? '1' : '0.6';
        });

        this.taskInput.placeholder = isEnabled
            ? 'Добавьте новую задачу...'
            : 'Войдите, чтобы добавлять задачи';
    }

    setAuthUiState() {
        const loggedIn = Boolean(this.user);
        this.registerBtn.style.display = loggedIn ? 'none' : 'inline-block';
        this.loginBtn.style.display = loggedIn ? 'none' : 'inline-block';
        this.logoutBtn.style.display = loggedIn ? 'inline-block' : 'none';

        this.usernameInput.disabled = loggedIn;
        this.passwordInput.disabled = loggedIn;

        if (loggedIn) {
            this.setAuthStatus(`Вы вошли как: ${this.user.username}`);
        }
    }

    async refreshAuthState() {
        if (!this.token) {
            this.user = null;
            this.tasks = [];
            this.setTodoEnabled(false);
            this.setAuthUiState();
            this.render();
            return;
        }

        try {
            const data = await this.apiRequest('/api/me', { method: 'GET' });
            this.user = data.user;
            this.tasks = this.loadFromStorage();
            this.setTodoEnabled(true);
            this.setAuthUiState();
            this.render();
        } catch {
            this.token = '';
            localStorage.removeItem('authToken');
            this.user = null;
            this.tasks = [];
            this.setTodoEnabled(false);
            this.setAuthUiState();
            this.render();
        }
    }

    async register() {
        try {
            const username = this.usernameInput.value.trim();
            const password = this.passwordInput.value;

            const data = await this.apiRequest('/api/register', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            this.token = data.token;
            localStorage.setItem('authToken', this.token);
            this.user = data.user;
            this.tasks = this.loadFromStorage();
            this.setTodoEnabled(true);
            this.setAuthUiState();
            this.render();
        } catch (e) {
            this.setAuthStatus(`Ошибка: ${e.message}`);
        }
    }

    async login() {
        try {
            const username = this.usernameInput.value.trim();
            const password = this.passwordInput.value;

            const data = await this.apiRequest('/api/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            this.token = data.token;
            localStorage.setItem('authToken', this.token);
            this.user = data.user;
            this.tasks = this.loadFromStorage();
            this.setTodoEnabled(true);
            this.setAuthUiState();
            this.render();
        } catch (e) {
            this.setAuthStatus(`Ошибка: ${e.message}`);
        }
    }

    logout() {
        this.token = '';
        localStorage.removeItem('authToken');
        this.user = null;
        this.tasks = [];
        this.setTodoEnabled(false);
        this.setAuthUiState();
        this.render();
    }
    
    addTask() {
        if (!this.user) {
            this.setAuthStatus('Сначала выполните вход');
            return;
        }

        const text = this.taskInput.value.trim();
        
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
        
        this.tasks.push(task);
        this.taskInput.value = '';
        this.taskInput.focus();
        this.saveToStorage();
        this.render();
    }
    
    deleteTask(id) {
        if (!this.user) return;
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveToStorage();
        this.render();
    }
    
    toggleTask(id) {
        if (!this.user) return;
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveToStorage();
            this.render();
        }
    }
    
    clearCompleted() {
        if (!this.user) return;
        const hasCompleted = this.tasks.some(t => t.completed);
        if (!hasCompleted) {
            alert('Нет выполненных задач для удаления');
            return;
        }
        
        if (confirm('Вы уверены, что хотите удалить все выполненные задачи?')) {
            this.tasks = this.tasks.filter(task => !task.completed);
            this.saveToStorage();
            this.render();
        }
    }
    
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }
    
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        
        this.totalCountEl.textContent = total;
        this.completedCountEl.textContent = completed;
    }
    
    render() {
        const filteredTasks = this.getFilteredTasks();
        this.taskList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            this.taskList.innerHTML = '<div class="empty-state">Нет задач</div>';
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
                
                checkbox.addEventListener('change', () => this.toggleTask(task.id));
                deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
                
                this.taskList.appendChild(li);
            });
        }
        
        this.updateStats();
    }
    
    saveToStorage() {
        if (!this.user) return;
        localStorage.setItem(`todoTasks:${this.user.username}`, JSON.stringify(this.tasks));
    }
    
    loadFromStorage() {
        if (!this.user) return [];
        const stored = localStorage.getItem(`todoTasks:${this.user.username}`);
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
