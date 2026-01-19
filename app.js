// ===== SUPABASE & AUTH =====
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import SUPABASE_CONFIG from './config.js';

// Initialize Supabase client
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Check authentication before loading app
let currentUser = null;

async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (!session) {
        // Not authenticated, redirect to login
        window.location.href = './login.html';
        return false;
    }
    
    currentUser = session.user;
    return true;
}

// Setup auth state listener
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        window.location.href = './login.html';
    } else if (event === 'SIGNED_IN') {
        currentUser = session.user;
    }
});

// ===== DATA MODEL & STORAGE =====

class DataStore {
    constructor(userId) {
        this.userId = userId;
        this.activityCatalog = [];
        this.plansByDate = {};
        this.completionByDate = {};
    }

    async init() {
        // Load all user data from Supabase
        await Promise.all([
            this.loadCatalog(),
            this.loadPlans(),
            this.loadCompletions()
        ]);
    }

    // Activity Catalog
    async loadCatalog() {
        try {
            const { data, error } = await supabase
                .from('activity_catalog')
                .select('activity_name')
                .eq('user_id', this.userId)
                .order('activity_name');

            if (error) throw error;
            this.activityCatalog = data ? data.map(row => row.activity_name) : [];
        } catch (e) {
            console.error('Error loading catalog:', e);
            this.activityCatalog = [];
        }
    }

    async addToCatalog(activityName) {
        if (!this.activityCatalog.includes(activityName)) {
            try {
                const { error } = await supabase
                    .from('activity_catalog')
                    .insert([{ user_id: this.userId, activity_name: activityName }]);

                if (error) throw error;
                this.activityCatalog.push(activityName);
            } catch (e) {
                console.error('Error adding to catalog:', e);
            }
        }
    }

    getCatalog() {
        return [...this.activityCatalog];
    }

    // Plans
    async loadPlans() {
        try {
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .eq('user_id', this.userId);

            if (error) throw error;
            
            this.plansByDate = {};
            if (data) {
                data.forEach(row => {
                    this.plansByDate[row.date] = row.activities;
                });
            }
        } catch (e) {
            console.error('Error loading plans:', e);
            this.plansByDate = {};
        }
    }

    getPlan(date) {
        return this.plansByDate[date] || [];
    }

    async savePlan(date, activities) {
        this.plansByDate[date] = activities;
        
        try {
            const { error } = await supabase
                .from('plans')
                .upsert([{
                    user_id: this.userId,
                    date: date,
                    activities: activities
                }], { onConflict: 'user_id,date' });

            if (error) throw error;
        } catch (e) {
            console.error('Error saving plan:', e);
        }
    }

    // Completion
    async loadCompletions() {
        try {
            const { data, error } = await supabase
                .from('completions')
                .select('*')
                .eq('user_id', this.userId);

            if (error) throw error;
            
            this.completionByDate = {};
            if (data) {
                data.forEach(row => {
                    this.completionByDate[row.date] = row.completion_data;
                });
            }
        } catch (e) {
            console.error('Error loading completions:', e);
            this.completionByDate = {};
        }
    }

    getCompletion(date) {
        return this.completionByDate[date] || {};
    }

    async saveCompletion(date, completion) {
        this.completionByDate[date] = completion;
        
        try {
            const { error } = await supabase
                .from('completions')
                .upsert([{
                    user_id: this.userId,
                    date: date,
                    completion_data: completion
                }], { onConflict: 'user_id,date' });

            if (error) throw error;
        } catch (e) {
            console.error('Error saving completion:', e);
        }
    }

    // Stats
    getDailyStats(date) {
        const plan = this.getPlan(date);
        const completion = this.getCompletion(date);
        
        if (plan.length === 0) {
            return { total: 0, completed: 0, percentage: 0 };
        }

        const completed = plan.filter(activity => completion[activity.id]).length;
        const percentage = Math.round((completed / plan.length) * 100);

        return { total: plan.length, completed, percentage };
    }

    getAllDates() {
        return Object.keys(this.plansByDate);
    }
}

// ===== DATE UTILITIES =====

class DateUtils {
    // Timezone offset for IST (GMT+5:30)
    static TIMEZONE_OFFSET_MINUTES = 330; // 5 hours 30 minutes = 330 minutes

    // Get current date/time in IST timezone
    static getNowIST() {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const ist = new Date(utc + (this.TIMEZONE_OFFSET_MINUTES * 60000));
        return ist;
    }

    static formatDate(date) {
        // Format date as YYYY-MM-DD in local timezone (not UTC)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    static parseDate(dateString) {
        return new Date(dateString + 'T00:00:00');
    }

    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    static formatDisplayDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    static formatShortDate(date) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    static isToday(date) {
        const today = this.getToday();
        return this.formatDate(date) === this.formatDate(today);
    }

    static getToday() {
        // Return today's date in IST
        return this.getNowIST();
    }

    static getTomorrow() {
        return this.addDays(this.getToday(), 1);
    }

    static getYesterday() {
        return this.addDays(this.getToday(), -1);
    }
}

// ===== APP STATE =====

class App {
    constructor(user) {
        this.user = user;
        this.store = new DataStore(user.id);
        this.currentPage = 'plan';
        this.selectedDate = DateUtils.getToday();
        this.currentMonth = new Date(DateUtils.getToday());
    }

    async init() {
        // Load user data from Supabase
        await this.store.init();
        
        // Setup UI
        this.setupAuth();
        this.setupNavigation();
        this.setupCalendar();
        this.setupPlanPage();
        this.setupDashboard();
        this.renderCalendar();
        this.renderDatePanel();
    }

    setupAuth() {
        // Display user email
        const userEmailEl = document.getElementById('user-email');
        if (userEmailEl && this.user.email) {
            userEmailEl.textContent = this.user.email;
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    const { error } = await supabase.auth.signOut();
                    if (error) throw error;
                    // Redirect will happen via auth state listener
                } catch (error) {
                    console.error('Logout error:', error);
                    alert('Failed to logout. Please try again.');
                }
            });
        }
    }

    setupCalendar() {
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
            this.renderCalendar();
        });
    }

    renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        const monthTitle = document.getElementById('calendar-month');

        // Set month title
        monthTitle.textContent = this.currentMonth.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });

        // Clear grid
        grid.innerHTML = '';

        // Add day labels
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayLabels.forEach(label => {
            const dayLabel = document.createElement('div');
            dayLabel.className = 'calendar-day-label';
            dayLabel.textContent = label;
            grid.appendChild(dayLabel);
        });

        // Get first day of month and number of days
        const firstDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
        const lastDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);
        const today = DateUtils.getToday();

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-date other-month';
            grid.appendChild(emptyCell);
        }

        // Add days of month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), day);
            const dateStr = DateUtils.formatDate(date);
            const plan = this.store.getPlan(dateStr);
            const completion = this.store.getCompletion(dateStr);
            const stats = this.store.getDailyStats(dateStr);

            const dateCell = document.createElement('div');
            dateCell.className = 'calendar-date';
            dateCell.dataset.date = dateStr;

            // Add classes
            if (DateUtils.formatDate(date) === DateUtils.formatDate(today)) {
                dateCell.classList.add('today');
            }
            if (DateUtils.formatDate(date) === DateUtils.formatDate(this.selectedDate)) {
                dateCell.classList.add('selected');
            }
            if (plan.length > 0) {
                dateCell.classList.add('has-plan');
            }

            // Add content
            const dayNumber = document.createElement('div');
            dayNumber.textContent = day;
            dateCell.appendChild(dayNumber);

            // Add completion indicator
            if (plan.length > 0) {
                const completionIndicator = document.createElement('div');
                completionIndicator.className = 'calendar-date-completion';
                completionIndicator.textContent = `${stats.completed}/${stats.total}`;
                dateCell.appendChild(completionIndicator);
            }

            // Click handler
            dateCell.addEventListener('click', () => {
                this.selectDate(date);
            });

            grid.appendChild(dateCell);
        }
    }

    selectDate(date) {
        this.selectedDate = date;
        this.renderCalendar();
        this.renderDatePanel();
    }

    renderDatePanel() {
        const today = DateUtils.getToday();
        const yesterday = DateUtils.addDays(today, -1);
        const dateStr = DateUtils.formatDate(this.selectedDate);

        // Update header
        document.getElementById('selected-date-title').textContent = 
            DateUtils.formatDisplayDate(this.selectedDate);

        // Update status badges
        const badges = document.getElementById('status-badges');
        badges.innerHTML = '';

        const canPlan = this.canEditPlan(this.selectedDate);
        const canCheck = this.canEditCompletion(this.selectedDate);

        if (canPlan) {
            badges.innerHTML += '<span class="status-badge planning-open">Planning Open</span>';
        }
        if (canCheck) {
            badges.innerHTML += '<span class="status-badge check-open">Check Open</span>';
        }
        if (!canPlan && !canCheck) {
            badges.innerHTML += '<span class="status-badge locked">Locked</span>';
        }

        // Render plan section
        this.renderPlanSection();

        // Render check section
        this.renderCheckSection();
    }

    renderPlanSection() {
        const dateStr = DateUtils.formatDate(this.selectedDate);
        const plan = this.store.getPlan(dateStr);
        const container = document.getElementById('plan-activities');
        const input = document.getElementById('activity-input');
        const canEdit = this.canEditPlan(this.selectedDate);

        // Update hint
        const hint = document.getElementById('plan-hint');
        hint.textContent = canEdit ? '' : 'Read-only (past date)';

        // Enable/disable input
        input.disabled = !canEdit;
        input.placeholder = canEdit ? 
            'Type or select an activity...' : 
            'Cannot plan for past dates';

        // Render activities
        if (plan.length === 0) {
            container.innerHTML = '<div class="empty-state">No activities planned yet</div>';
            return;
        }

        container.innerHTML = plan.map(activity => `
            <div class="activity-item" ${canEdit ? 'draggable="true"' : ''} data-id="${activity.id}">
                <span class="activity-name">${this.escapeHtml(activity.name)}</span>
                ${canEdit ? '<span class="drag-handle">⋮⋮</span>' : ''}
                ${canEdit ? `
                    <div class="activity-actions">
                        <button class="action-btn delete-btn" data-id="${activity.id}">×</button>
                    </div>
                ` : ''}
            </div>
        `).join('');

        if (canEdit) {
            this.setupDragAndDrop(container, dateStr);
            container.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.deleteActivity(dateStr, btn.dataset.id);
                });
            });
        }
    }

    renderCheckSection() {
        const dateStr = DateUtils.formatDate(this.selectedDate);
        const plan = this.store.getPlan(dateStr);
        const completion = this.store.getCompletion(dateStr);
        const container = document.getElementById('check-activities');
        const canEdit = this.canEditCompletion(this.selectedDate);

        // Update hint
        const hint = document.getElementById('check-hint');
        if (!canEdit && plan.length > 0) {
            hint.textContent = 'Locked (can only check today & yesterday)';
        } else {
            hint.textContent = '';
        }

        // Show/hide completion summary
        const summary = document.getElementById('completion-summary');
        if (plan.length > 0) {
            summary.style.display = 'block';
            const stats = this.store.getDailyStats(dateStr);
            document.querySelector('.completed-count').textContent = `${stats.completed}/${stats.total}`;
            document.querySelector('.completion-percentage').textContent = `${stats.percentage}%`;
        } else {
            summary.style.display = 'none';
        }

        // Render activities
        if (plan.length === 0) {
            container.innerHTML = '<div class="empty-state">No activities to check</div>';
            return;
        }

        container.innerHTML = plan.map(activity => {
            const isCompleted = completion[activity.id] || false;
            return `
                <div class="activity-item ${isCompleted ? 'completed' : ''} ${!canEdit ? 'readonly' : ''}" data-id="${activity.id}">
                    <div class="activity-checkbox ${isCompleted ? 'checked' : ''} ${!canEdit ? 'disabled' : ''}" data-id="${activity.id}"></div>
                    <span class="activity-name">${this.escapeHtml(activity.name)}</span>
                </div>
            `;
        }).join('');

        if (canEdit) {
            container.querySelectorAll('.activity-checkbox:not(.disabled)').forEach(checkbox => {
                checkbox.addEventListener('click', () => {
                    this.toggleCompletion(dateStr, checkbox.dataset.id);
                });
            });
        }
    }

    canEditPlan(date) {
        const today = DateUtils.getToday();
        
        // Normalize dates to strings for comparison (ignore time component)
        const dateStr = DateUtils.formatDate(date);
        const todayStr = DateUtils.formatDate(today);
        
        // Can plan for today and future dates
        return dateStr >= todayStr;
    }

    canEditCompletion(date) {
        const today = DateUtils.getToday();
        const yesterday = DateUtils.addDays(today, -1);
        
        // Normalize all dates to date strings for comparison
        const dateStr = DateUtils.formatDate(date);
        const todayStr = DateUtils.formatDate(today);
        const yesterdayStr = DateUtils.formatDate(yesterday);
        
        // Only today and yesterday can be edited
        const isToday = dateStr === todayStr;
        const isYesterday = dateStr === yesterdayStr;
        
        return isToday || isYesterday;
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateTo(page);
            });
        });
    }

    navigateTo(page) {
        // Update current page
        this.currentPage = page;

        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.page === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Show/hide pages
        document.querySelectorAll('.page').forEach(pageEl => {
            pageEl.classList.remove('active');
        });

        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Render dashboard if navigating to it
        if (page === 'dashboard') {
            this.renderDashboard();
        }
    }

    setupPlanPage() {
        const input = document.getElementById('activity-input');
        const dropdown = document.getElementById('suggestions-dropdown');

        // Show suggestions on focus and input
        input.addEventListener('focus', () => {
            if (!input.disabled) {
                this.showSuggestions(input.value);
            }
        });

        input.addEventListener('input', (e) => {
            if (!input.disabled) {
                this.showSuggestions(e.target.value);
            }
        });

        // Enter key to add activity
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !input.disabled) {
                e.preventDefault();
                const query = input.value.trim();
                if (query) {
                    this.addActivity(query);
                }
            }
        });

        // Click outside to hide dropdown
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.combobox-container')) {
                dropdown.classList.remove('active');
            }
        });

        // Update today date in header
        document.getElementById('today-date').textContent = 
            DateUtils.formatDisplayDate(DateUtils.getToday());
    }

    showSuggestions(query) {
        const dropdown = document.getElementById('suggestions-dropdown');
        const catalog = this.store.getCatalog();

        if (catalog.length === 0 && !query) {
            dropdown.classList.remove('active');
            return;
        }

        const filtered = query ? 
            catalog.filter(name => name.toLowerCase().includes(query.toLowerCase())) : 
            catalog;

        dropdown.innerHTML = '';

        // Show existing suggestions
        filtered.slice(0, 5).forEach(name => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = name;
            item.addEventListener('click', () => {
                this.addActivity(name);
            });
            dropdown.appendChild(item);
        });

        // Add "Create new" option if query doesn't match exactly
        if (query && !catalog.some(name => name.toLowerCase() === query.toLowerCase())) {
            const createItem = document.createElement('div');
            createItem.className = 'suggestion-item create-new';
            createItem.textContent = `+ Create "${query}"`;
            createItem.addEventListener('click', () => {
                this.addActivity(query);
            });
            dropdown.appendChild(createItem);
        }

        if (dropdown.children.length > 0) {
            dropdown.classList.add('active');
        } else {
            dropdown.classList.remove('active');
        }
    }

    addActivity(name) {
        const input = document.getElementById('activity-input');
        const dateStr = DateUtils.formatDate(this.selectedDate);

        if (!name || !this.canEditPlan(this.selectedDate)) return;

        const plan = this.store.getPlan(dateStr);
        const newActivity = {
            id: Date.now().toString(),
            name: name.trim()
        };

        plan.push(newActivity);
        this.store.savePlan(dateStr, plan);
        this.store.addToCatalog(name.trim());

        input.value = '';
        document.getElementById('suggestions-dropdown').classList.remove('active');
        
        this.renderCalendar();
        this.renderDatePanel();
        this.showSaveStatus();
    }

    deleteActivity(date, activityId) {
        const plan = this.store.getPlan(date);
        const filtered = plan.filter(a => a.id !== activityId);
        this.store.savePlan(date, filtered);
        
        this.renderCalendar();
        this.renderDatePanel();
        this.showSaveStatus();
    }

    toggleCompletion(date, activityId) {
        const completion = this.store.getCompletion(date);
        completion[activityId] = !completion[activityId];
        this.store.saveCompletion(date, completion);
        
        this.renderCalendar();
        this.renderDatePanel();
    }

    setupDragAndDrop(container, date) {
        let draggedElement = null;

        container.querySelectorAll('.activity-item[draggable="true"]').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedElement = item;
                item.style.opacity = '0.5';
            });

            item.addEventListener('dragend', (e) => {
                item.style.opacity = '1';
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedElement !== item) {
                    const plan = this.store.getPlan(date);
                    const draggedId = draggedElement.dataset.id;
                    const targetId = item.dataset.id;

                    const draggedIndex = plan.findIndex(a => a.id === draggedId);
                    const targetIndex = plan.findIndex(a => a.id === targetId);

                    const [removed] = plan.splice(draggedIndex, 1);
                    plan.splice(targetIndex, 0, removed);

                    this.store.savePlan(date, plan);
                    this.renderDatePanel();
                    this.showSaveStatus();
                }
            });
        });
    }

    showSaveStatus() {
        const status = document.getElementById('save-status');
        status.classList.add('show');
        setTimeout(() => status.classList.remove('show'), 2000);
    }
    // ===== DASHBOARD =====

    setupDashboard() {
        // Modal close
        document.getElementById('modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.querySelector('.modal-overlay').addEventListener('click', () => {
            this.closeModal();
        });

        // Reset data button
        const resetBtn = document.getElementById('reset-data-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', async () => {
                const confirmed = confirm(
                    '⚠️ WARNING: This will permanently delete ALL your data including:\n\n' +
                    '• All activity catalog entries\n' +
                    '• All plans for all dates\n' +
                    '• All completion records\n\n' +
                    'This action CANNOT be undone!\n\n' +
                    'Are you absolutely sure you want to continue?'
                );

                if (!confirmed) return;

                // Double confirmation
                const doubleConfirm = confirm(
                    '🔴 FINAL CONFIRMATION\n\n' +
                    'Click OK to DELETE ALL DATA permanently.\n' +
                    'Click Cancel to keep your data safe.'
                );

                if (!doubleConfirm) return;

                try {
                    // Show loading state
                    resetBtn.disabled = true;
                    resetBtn.textContent = 'Deleting...';

                    // Delete all data from Supabase
                    const { error: catalogError } = await supabase
                        .from('activity_catalog')
                        .delete()
                        .eq('user_id', this.user.id);

                    const { error: plansError } = await supabase
                        .from('plans')
                        .delete()
                        .eq('user_id', this.user.id);

                    const { error: completionsError } = await supabase
                        .from('completions')
                        .delete()
                        .eq('user_id', this.user.id);

                    if (catalogError || plansError || completionsError) {
                        throw new Error('Failed to delete some data');
                    }

                    // Clear local store
                    this.store.activityCatalog = [];
                    this.store.plansByDate = {};
                    this.store.completionByDate = {};

                    // Refresh UI
                    this.renderCalendar();
                    this.renderDatePanel();
                    this.renderDashboard();

                    alert('✅ All data has been successfully deleted.');
                } catch (error) {
                    console.error('Reset error:', error);
                    alert('❌ Failed to delete data. Please try again or contact support.');
                } finally {
                    resetBtn.disabled = false;
                    resetBtn.textContent = 'Reset All Data';
                }
            });
        }
    }

    renderDashboard() {
        this.renderStats();
        this.renderHeatmap();
    }

    renderStats() {
        const today = DateUtils.getToday();
        const thirtyDaysAgo = DateUtils.addDays(today, -30);

        let totalCompleted = 0;
        let totalPercentages = [];
        let bestDay = { date: null, percentage: 0 };

        // Calculate stats for last 30 days
        for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = DateUtils.formatDate(d);
            const stats = this.store.getDailyStats(dateStr);

            if (stats.total > 0) {
                totalCompleted += stats.completed;
                totalPercentages.push(stats.percentage);

                if (stats.percentage > bestDay.percentage) {
                    bestDay = { date: new Date(d), percentage: stats.percentage };
                }
            }
        }

        // Average
        const avgScore = totalPercentages.length > 0
            ? Math.round(totalPercentages.reduce((a, b) => a + b, 0) / totalPercentages.length)
            : 0;

        document.getElementById('avg-score').textContent = `${avgScore}%`;
        document.getElementById('best-day').textContent = bestDay.date
            ? `${bestDay.percentage}% (${DateUtils.formatShortDate(bestDay.date)})`
            : '—';
        document.getElementById('total-completed').textContent = totalCompleted;
    }

    renderHeatmap() {
        const grid = document.getElementById('heatmap-grid');
        const today = DateUtils.getToday();
        
        // Start from January 1, 2026 (strict requirement)
        const startDate = new Date(2026, 0, 1); // Jan 1, 2026
        
        grid.innerHTML = '';

        // Calculate weeks needed
        const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
        const weeksNeeded = Math.ceil((startDate.getDay() + daysSinceStart) / 7);

        // Create week columns
        for (let week = 0; week < weeksNeeded; week++) {
            const weekColumn = document.createElement('div');
            weekColumn.className = 'heatmap-week';

            // Create 7 day cells (Sun-Sat)
            for (let day = 0; day < 7; day++) {
                const dayIndex = week * 7 + day - startDate.getDay();
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + dayIndex);

                const dateStr = DateUtils.formatDate(currentDate);
                const isBeforeStart = currentDate < startDate;
                const isFuture = currentDate > today;
                const isToday = DateUtils.formatDate(currentDate) === DateUtils.formatDate(today);

                const tile = document.createElement('div');
                tile.className = 'heatmap-tile';

                if (isBeforeStart) {
                    // Empty placeholder for alignment
                    tile.classList.add('empty');
                } else if (isFuture) {
                    // Future dates - disabled/neutral (NO click events)
                    tile.classList.add('future');
                    tile.dataset.date = dateStr;
                    // Do not add any event listeners for future dates
                } else {
                    // Valid dates (past and today)
                    const stats = this.store.getDailyStats(dateStr);
                    const level = this.getHeatLevel(stats.percentage);

                    tile.classList.add(`level-${level}`);
                    tile.dataset.date = dateStr;
                    tile.dataset.percentage = stats.percentage;
                    tile.dataset.completed = stats.completed;
                    tile.dataset.total = stats.total;

                    if (isToday) {
                        tile.classList.add('today');
                    }

                    // Hover tooltip
                    tile.addEventListener('mouseenter', (e) => this.showTooltip(e, tile));
                    tile.addEventListener('mouseleave', () => this.hideTooltip());

                    // Click to open modal
                    tile.addEventListener('click', () => this.openDayModal(dateStr));
                }

                weekColumn.appendChild(tile);
            }

            grid.appendChild(weekColumn);
        }

        // Add month labels
        this.addMonthLabels(grid, startDate, today);
    }

    addMonthLabels(grid, startDate, endDate) {
        const container = grid.parentElement;
        let existingLabels = container.querySelector('.month-labels');
        if (existingLabels) {
            existingLabels.remove();
        }

        const labels = document.createElement('div');
        labels.className = 'month-labels';

        let currentMonth = startDate.getMonth();
        let weekIndex = 0;
        
        const tempDate = new Date(startDate);
        while (tempDate <= endDate) {
            if (tempDate.getMonth() !== currentMonth && tempDate.getDate() <= 7) {
                const label = document.createElement('div');
                label.className = 'month-label';
                label.textContent = tempDate.toLocaleDateString('en-US', { month: 'short' });
                label.style.left = `${weekIndex * 18}px`;
                labels.appendChild(label);
                currentMonth = tempDate.getMonth();
            }
            tempDate.setDate(tempDate.getDate() + 7);
            weekIndex++;
        }

        container.insertBefore(labels, grid);
    }

    getHeatLevel(percentage) {
        if (percentage === 0) return 0;
        if (percentage <= 25) return 1;
        if (percentage <= 50) return 2;
        if (percentage <= 75) return 3;
        return 4;
    }

    showTooltip(event, tile) {
        const existing = document.querySelector('.tooltip');
        if (existing) existing.remove();

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';

        const date = DateUtils.parseDate(tile.dataset.date);
        const percentage = tile.dataset.percentage;
        const completed = tile.dataset.completed;
        const total = tile.dataset.total;

        // Format: "January 15, 2026 · 75% · 3/4 activities completed"
        const dateText = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        tooltip.textContent = `${dateText} · ${percentage}% · ${completed}/${total} ${total === 1 ? 'activity' : 'activities'} completed`;

        document.body.appendChild(tooltip);

        const rect = tile.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
    }

    hideTooltip() {
        const tooltip = document.querySelector('.tooltip');
        if (tooltip) tooltip.remove();
    }

    openDayModal(dateStr) {
        const modal = document.getElementById('day-modal');
        const date = DateUtils.parseDate(dateStr);
        const plan = this.store.getPlan(dateStr);
        const completion = this.store.getCompletion(dateStr);
        const stats = this.store.getDailyStats(dateStr);
        const canEdit = this.canEditCompletion(date);

        document.getElementById('modal-date').textContent = DateUtils.formatDisplayDate(date);
        document.getElementById('modal-score').textContent = `${stats.percentage}%`;
        document.getElementById('modal-completion').textContent = `${stats.completed}/${stats.total} completed`;

        const activitiesContainer = document.getElementById('modal-activities');

        if (plan.length === 0) {
            activitiesContainer.innerHTML = '<div class="empty-state">No activities planned</div>';
        } else {
            activitiesContainer.innerHTML = plan.map(activity => {
                const isCompleted = completion[activity.id] || false;
                return `
                    <div class="modal-activity-item ${isCompleted ? 'completed' : ''}">
                        <input 
                            type="checkbox" 
                            class="activity-checkbox" 
                            data-activity-id="${activity.id}" 
                            data-date="${dateStr}"
                            ${isCompleted ? 'checked' : ''} 
                            ${canEdit ? '' : 'disabled'}
                        >
                        <span class="modal-activity-name">${this.escapeHtml(activity.name)}</span>
                    </div>
                `;
            }).join('');

            // Add event listeners for checkboxes if editable
            if (canEdit) {
                activitiesContainer.querySelectorAll('.activity-checkbox').forEach(checkbox => {
                    checkbox.addEventListener('change', (e) => {
                        const activityId = e.target.dataset.activityId;
                        const dateStr = e.target.dataset.date;
                        const isChecked = e.target.checked;

                        const completion = this.store.getCompletion(dateStr);
                        completion[activityId] = isChecked;
                        this.store.saveCompletion(dateStr, completion);

                        // Update modal stats
                        const newStats = this.store.getDailyStats(dateStr);
                        document.getElementById('modal-score').textContent = `${newStats.percentage}%`;
                        document.getElementById('modal-completion').textContent = `${newStats.completed}/${newStats.total} completed`;

                        // Toggle completed class
                        e.target.closest('.modal-activity-item').classList.toggle('completed', isChecked);

                        // Refresh dashboard (if we're viewing dashboard page)
                        if (this.currentPage === 'dashboard') {
                            this.renderDashboard();
                        }
                    });
                });
            }
        }

        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('day-modal').classList.remove('active');
    }

    // ===== UTILS =====

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ===== INIT APP =====

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
        return; // Will redirect to login
    }

    // Initialize app with authenticated user
    const app = new App(currentUser);
    await app.init();
});
