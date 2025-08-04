class TitlePlanningDashboard {
    constructor() {
        this.titles = JSON.parse(localStorage.getItem('titles')) || [];
        this.plans = JSON.parse(localStorage.getItem('plans')) || [];
        this.activities = JSON.parse(localStorage.getItem('activities')) || [];
        this.currentUser = localStorage.getItem('currentUser') || '';
        this.allocation = JSON.parse(localStorage.getItem('allocation')) || {
            marqueeTotal: 12,
            blockbusterTotal: 6
        };
        this.chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
        this.activeUsers = new Set();
        this.activityPaused = false;
        
        this.loadFromCloud();
        this.initializeRealtime();
        this.init();
    }
    
    async loadFromCloud() {
        if (window.loadFromCloud) {
            try {
                const cloudTitles = await window.loadFromCloud('titles');
                const cloudPlans = await window.loadFromCloud('plans');
                const cloudActivities = await window.loadFromCloud('activities');
                const cloudAllocation = await window.loadFromCloud('allocation');
                const cloudChatHistory = await window.loadFromCloud('chatHistory');
                
                if (cloudTitles) this.titles = cloudTitles;
                if (cloudPlans) this.plans = cloudPlans;
                if (cloudActivities) this.activities = cloudActivities;
                if (cloudAllocation) this.allocation = cloudAllocation;
                if (cloudChatHistory) this.chatHistory = cloudChatHistory;
                
                // Set up real-time sync
                if (window.syncData) {
                    window.syncData('titles', (data) => {
                        this.titles = data;
                        this.renderTitles();
                        this.updateTitleFilter();
                    });
                    window.syncData('plans', (data) => {
                        this.plans = data;
                        this.renderPlans();
                        this.renderAllocation();
                    });
                    window.syncData('activities', (data) => {
                        this.activities = data;
                        this.renderActivity();
                    });
                }
            } catch (error) {
                console.log('Cloud load failed, using local storage');
            }
        }
    }

    init() {
        this.setupEventListeners();
        this.loadUserInfo();
        this.renderDashboard();
        this.renderTitles();
        this.renderPlans();
        this.renderActivity();
        this.updateTitleFilter();
        this.renderAllocation();
        this.loadAllocationSettings();
        this.initializeChatbot();
        this.loadSampleData();
        this.startDashboardUpdates();
    }
    
    async initializeRealtime() {
        if (window.realtimeSync) {
            await window.realtimeSync.initialize();
            
            // Listen for real-time changes
            window.realtimeSync.onDataChange((change) => {
                this.handleRealtimeChange(change);
            });
        }
    }
    
    handleRealtimeChange(change) {
        const { dataType, data, user, timestamp } = change;
        
        switch (dataType) {
            case 'titles':
                this.titles = data;
                this.renderTitles();
                this.renderDashboard();
                break;
            case 'plans':
                this.plans = data;
                this.renderPlans();
                this.renderDashboard();
                break;
            case 'activities':
                this.activities = data;
                this.renderActivity();
                break;
        }
        
        this.showRealtimeNotification(`${user} made changes`, dataType);
    }
    
    showRealtimeNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = 'realtime-notification';
        notification.innerHTML = `
            <span class="notification-icon">🔄</span>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    renderDashboard() {
        this.updateDashboardStats();
        this.updateDashboardAllocation();
        this.updateDashboardActivity();
        this.updateTeamMembers();
        this.updatePriorityTitles();
    }
    
    updateDashboardStats() {
        const totalTitles = this.titles.length;
        const highPriority = this.titles.filter(t => t.priority === 'High').length;
        const withPlans = this.plans.length;
        
        document.getElementById('totalTitles').textContent = totalTitles;
        document.getElementById('highPriority').textContent = highPriority;
        document.getElementById('withPlans').textContent = withPlans;
    }
    
    updateDashboardAllocation() {
        const marqueeUsed = this.plans.filter(p => p.campaignType === 'Marquee').length;
        const blockbusterUsed = this.plans.filter(p => p.campaignType === 'Blockbuster').length;
        
        document.getElementById('dashMarqueeUsed').textContent = marqueeUsed;
        document.getElementById('dashMarqueeTotal').textContent = this.allocation.marqueeTotal;
        document.getElementById('dashBlockbusterUsed').textContent = blockbusterUsed;
        document.getElementById('dashBlockbusterTotal').textContent = this.allocation.blockbusterTotal;
        
        const marqueePercent = (marqueeUsed / this.allocation.marqueeTotal) * 100;
        const blockbusterPercent = (blockbusterUsed / this.allocation.blockbusterTotal) * 100;
        
        document.getElementById('dashMarqueeBar').style.width = `${Math.min(marqueePercent, 100)}%`;
        document.getElementById('dashBlockbusterBar').style.width = `${Math.min(blockbusterPercent, 100)}%`;
    }
    
    updateDashboardActivity() {
        const recentActivities = this.activities.slice(0, 5);
        const container = document.getElementById('dashboardActivity');
        
        container.innerHTML = recentActivities.map(activity => `
            <div class="mini-activity">
                <span class="activity-user">${activity.user}</span>
                <span class="activity-text">${activity.message.substring(0, 50)}...</span>
                <span class="activity-time">${this.getTimeAgo(new Date(activity.timestamp))}</span>
            </div>
        `).join('');
    }
    
    updateTeamMembers() {
        const users = [...new Set(this.activities.map(a => a.user).filter(u => u))];
        const container = document.getElementById('teamMembers');
        
        container.innerHTML = users.map(user => `
            <div class="team-member">
                <span class="member-avatar">${user.charAt(0).toUpperCase()}</span>
                <span class="member-name">${user}</span>
                <span class="member-status online">●</span>
            </div>
        `).join('');
        
        document.getElementById('activeUserCount').textContent = users.length;
    }
    
    updatePriorityTitles() {
        const priorityTitles = this.titles
            .filter(t => t.priority === 'High')
            .sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0))
            .slice(0, 5);
            
        const container = document.getElementById('priorityTitles');
        
        container.innerHTML = priorityTitles.map(title => `
            <div class="priority-title-card">
                <div class="title-info">
                    <h4>${title.title}</h4>
                    <p>by ${title.author}</p>
                </div>
                <div class="title-meta">
                    <span class="marketing-tier tier-${title.marketingTier?.toLowerCase()}">${title.marketingTier || 'None'}</span>
                    <span class="social-count">${(title.socialFollowing || 0).toLocaleString()}</span>
                </div>
                <div class="title-actions">
                    <button class="btn-mini" onclick="app.openPlanModal('${title.id}')">Plan</button>
                </div>
            </div>
        `).join('');
    }
    
    startDashboardUpdates() {
        // Update dashboard every 30 seconds
        setInterval(() => {
            if (document.getElementById('dashboard').classList.contains('active')) {
                this.renderDashboard();
            }
        }, 30000);
    }
    
    toggleActivityUpdates() {
        this.activityPaused = !this.activityPaused;
        const btn = document.getElementById('pauseActivity');
        btn.textContent = this.activityPaused ? 'Resume Updates' : 'Pause Updates';
        btn.className = this.activityPaused ? 'btn-primary' : 'btn-secondary';
    }
    
    clearAllActivity() {
        if (confirm('Clear all activity history? This cannot be undone.')) {
            this.activities = [];
            this.saveData();
            this.renderActivity();
            this.renderDashboard();
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // User management
        document.getElementById('saveUser').addEventListener('click', () => this.saveUser());

        // Title management
        document.getElementById('addTitle').addEventListener('click', () => this.openTitleModal());
        document.getElementById('titleForm').addEventListener('submit', (e) => this.saveTitle(e));
        document.getElementById('cancelTitle').addEventListener('click', () => this.closeTitleModal());

        // Plan management
        document.getElementById('planForm').addEventListener('submit', (e) => this.savePlan(e));
        document.getElementById('cancelPlan').addEventListener('click', () => this.closePlanModal());

        // Modal close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
                document.body.style.overflow = '';
            });
        });

        // Title filter
        document.getElementById('titleFilter').addEventListener('change', (e) => this.filterPlans(e.target.value));

        // Allocation management
        document.getElementById('updateAllocation').addEventListener('click', () => this.updateAllocation());
        
        // Activity controls
        document.getElementById('pauseActivity')?.addEventListener('click', () => this.toggleActivityUpdates());
        document.getElementById('clearActivity')?.addEventListener('click', () => this.clearAllActivity());
        
        // Excel import
        document.getElementById('importExcel').addEventListener('click', () => document.getElementById('excelImport').click());
        document.getElementById('excelImport').addEventListener('change', (e) => this.handleExcelImport(e));
        
        // Bulk delete
        document.getElementById('bulkDelete').addEventListener('click', () => this.bulkDeleteTitles());
        document.getElementById('selectAll').addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        
        // Filters
        document.getElementById('titleSearch').addEventListener('input', () => this.applyFilters());
        document.getElementById('authorSearch').addEventListener('input', () => this.applyFilters());
        document.getElementById('dateFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('genreFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('priorityFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('tierFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('regionFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());
        
        // Chatbot
        document.getElementById('sendChat').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
        document.getElementById('clearChat').addEventListener('click', () => this.clearChat());

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
        
        // Prevent modal scroll issues
        this.setupModalScrollFix();
    }
    
    setupModalScrollFix() {
        // Prevent main page scrolling when scrolling within modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('wheel', (e) => {
                e.stopPropagation();
            }, { passive: true });
            
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.addEventListener('wheel', (e) => {
                    e.stopPropagation();
                }, { passive: true });
            }
        });
        
        // Prevent body scroll when modal is open
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        if (modal.style.display === 'block') {
                            document.body.style.overflow = 'hidden';
                        } else {
                            document.body.style.overflow = '';
                        }
                    }
                });
            });
            observer.observe(modal, { attributes: true });
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        // Update dashboard when switching to it
        if (tabName === 'dashboard') {
            this.renderDashboard();
        }
    }

    saveUser() {
        const userName = document.getElementById('userName').value.trim();
        if (userName) {
            this.currentUser = userName;
            localStorage.setItem('currentUser', userName);
            this.addActivity(`${userName} joined the planning session`);
        }
    }

    loadUserInfo() {
        if (this.currentUser) {
            document.getElementById('userName').value = this.currentUser;
        }
    }

    openTitleModal(title = null) {
        const modal = document.getElementById('titleModal');
        const form = document.getElementById('titleForm');
        
        if (title) {
            document.getElementById('modalTitle').textContent = 'Edit Title';
            document.getElementById('titleId').value = title.id;
            document.getElementById('titleIdField').value = title.titleId || title.id;
            document.getElementById('bookTitle').value = title.title;
            document.getElementById('author').value = title.author;
            document.getElementById('asin').value = title.asin || '';
            document.getElementById('status').value = title.status || 'In Development';
            document.getElementById('releaseDate').value = title.releaseDate;
            document.getElementById('genre').value = title.genre;
            document.getElementById('priority').value = title.priority;
            document.getElementById('audioSuccess').value = title.audioSuccess || 'None';
            document.getElementById('marketingTier').value = title.marketingTier || '';
            document.getElementById('salesTier').value = title.salesTier || 'Tier 4';
            document.getElementById('pr').value = title.pr || '';
            document.getElementById('imprint').value = title.imprint || 'Random House';
            document.getElementById('editor').value = title.editor || '';
            document.getElementById('amm').value = title.amm || '';
            document.getElementById('pubQuarter').value = title.pubQuarter || this.getQuarterFromDate(title.releaseDate);
            document.getElementById('selectionStrategy').value = title.selectionStrategy || 'Data-Driven';
            document.getElementById('socialFollowing').value = title.socialFollowing || '';
            document.getElementById('videoComfort').value = title.videoComfort || 'None';
            document.getElementById('region').value = title.region || 'US';
            document.getElementById('editorialReason').value = title.editorialReason || '';
        } else {
            document.getElementById('modalTitle').textContent = 'Add New Title';
            form.reset();
            document.getElementById('titleId').value = '';
            document.getElementById('status').value = 'In Development';
            document.getElementById('salesTier').value = 'Tier 4';
            document.getElementById('imprint').value = 'Random House';
            document.getElementById('selectionStrategy').value = 'Data-Driven';
        }
        
        modal.style.display = 'block';
    }

    closeTitleModal() {
        document.getElementById('titleModal').style.display = 'none';
        document.body.style.overflow = '';
    }

    saveTitle(e) {
        e.preventDefault();
        
        const titleData = {
            id: document.getElementById('titleId').value || Date.now().toString(),
            titleId: document.getElementById('titleIdField').value || document.getElementById('titleId').value || Date.now().toString(),
            title: document.getElementById('bookTitle').value,
            author: document.getElementById('author').value,
            asin: document.getElementById('asin').value,
            status: document.getElementById('status').value,
            releaseDate: document.getElementById('releaseDate').value,
            genre: document.getElementById('genre').value,
            priority: document.getElementById('priority').value,
            audioSuccess: document.getElementById('audioSuccess').value,
            marketingTier: document.getElementById('marketingTier').value || this.determineMarketingTier({
                author: document.getElementById('author').value,
                socialFollowing: parseInt(document.getElementById('socialFollowing').value) || 0,
                audioSuccess: document.getElementById('audioSuccess').value,
                videoComfort: document.getElementById('videoComfort').value
            }),
            salesTier: document.getElementById('salesTier').value,
            pr: document.getElementById('pr').value,
            imprint: document.getElementById('imprint').value,
            editor: document.getElementById('editor').value,
            amm: document.getElementById('amm').value,
            pubQuarter: document.getElementById('pubQuarter').value,
            selectionStrategy: document.getElementById('selectionStrategy').value,
            socialFollowing: parseInt(document.getElementById('socialFollowing').value) || this.getSocialFollowing(document.getElementById('author').value),
            videoComfort: document.getElementById('videoComfort').value,
            region: document.getElementById('region').value,
            editorialReason: document.getElementById('editorialReason').value,
            createdBy: this.currentUser,
            createdAt: new Date().toISOString(),
            rankingScore: 0
        };

        const existingIndex = this.titles.findIndex(t => t.id === titleData.id);
        if (existingIndex >= 0) {
            this.titles[existingIndex] = { ...this.titles[existingIndex], ...titleData };
            this.addActivity(`${this.currentUser} updated "${titleData.title}" (Tier: ${titleData.marketingTier})`);
        } else {
            this.titles.push(titleData);
            this.addActivity(`${this.currentUser} added new title "${titleData.title}" (Tier: ${titleData.marketingTier})`);
        }

        this.saveData();
        this.renderTitles();
        this.updateTitleFilter();
        this.renderAllocation(); // Update allocation counters
        this.closeTitleModal();
    }

    deleteTitle(id) {
        if (confirm('Are you sure you want to delete this title?')) {
            const title = this.titles.find(t => t.id === id);
            this.titles = this.titles.filter(t => t.id !== id);
            this.plans = this.plans.filter(p => p.titleId !== id);
            
            this.addActivity(`${this.currentUser} deleted title "${title.title}"`);
            this.saveData();
            this.renderTitles();
            this.renderPlans();
            this.updateTitleFilter();
        }
    }

    openPlanModal(titleId) {
        const title = this.titles.find(t => t.id === titleId);
        const existingPlan = this.plans.find(p => p.titleId === titleId);
        
        document.getElementById('planModalTitle').textContent = `Marketing Plan: ${title.title}`;
        document.getElementById('planTitleId').value = titleId;

        if (existingPlan) {
            document.getElementById('campaignStrategy').value = existingPlan.campaignStrategy || '';
            document.getElementById('targetAudience').value = existingPlan.targetAudience || '';
            document.getElementById('budget').value = existingPlan.budget || '';
            document.getElementById('milestones').value = existingPlan.milestones || '';
            document.getElementById('teamMembers').value = existingPlan.teamMembers || '';
            
            // Set checkboxes
            const channels = existingPlan.marketingChannels || [];
            document.querySelectorAll('#planForm input[type="checkbox"]').forEach(cb => {
                if (cb.value === 'US' || cb.value === 'UK') {
                    cb.checked = (existingPlan.regions || []).includes(cb.value);
                } else {
                    cb.checked = channels.includes(cb.value);
                }
            });
            
            document.getElementById('campaignType').value = existingPlan.campaignType || '';
        } else {
            document.getElementById('planForm').reset();
            document.getElementById('planTitleId').value = titleId;
        }

        document.getElementById('planModal').style.display = 'block';
    }

    closePlanModal() {
        document.getElementById('planModal').style.display = 'none';
        document.body.style.overflow = '';
    }

    savePlan(e) {
        e.preventDefault();
        
        const titleId = document.getElementById('planTitleId').value;
        const title = this.titles.find(t => t.id === titleId);
        
        const marketingChannels = Array.from(document.querySelectorAll('#planForm input[type="checkbox"]:checked'))
            .filter(cb => cb.value !== 'US' && cb.value !== 'UK')
            .map(cb => cb.value);
            
        const regions = Array.from(document.querySelectorAll('#regionUS:checked, #regionUK:checked'))
            .map(cb => cb.value);

        const planData = {
            titleId: titleId,
            campaignStrategy: document.getElementById('campaignStrategy').value,
            targetAudience: document.getElementById('targetAudience').value,
            marketingChannels: marketingChannels,
            regions: regions,
            campaignType: document.getElementById('campaignType').value,
            budget: document.getElementById('budget').value,
            milestones: document.getElementById('milestones').value,
            teamMembers: document.getElementById('teamMembers').value,
            updatedBy: this.currentUser,
            updatedAt: new Date().toISOString()
        };

        const existingIndex = this.plans.findIndex(p => p.titleId === titleId);
        if (existingIndex >= 0) {
            this.plans[existingIndex] = { ...this.plans[existingIndex], ...planData };
            this.addActivity(`${this.currentUser} updated marketing plan for "${title.title}"`);
        } else {
            this.plans.push(planData);
            this.addActivity(`${this.currentUser} created marketing plan for "${title.title}"`);
        }

        this.saveData();
        this.renderPlans();
        this.renderAllocation();
        this.closePlanModal();
    }

    renderTitles() {
        this.populateFilterOptions();
        const tbody = document.getElementById('titlesTableBody');
        tbody.innerHTML = '';

        // Sort titles by ranking score (highest first)
        const sortedTitles = [...this.titles].sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0));

        sortedTitles.forEach((title, index) => {
            const row = document.createElement('tr');
            
            const releaseDate = new Date(title.releaseDate).toLocaleDateString();
            const audioIndicator = this.getAudioIndicator(title.audioSuccess);
            const videoIndicator = this.getVideoIndicator(title.videoComfort);
            const socialFollowing = title.socialFollowing ? `${title.socialFollowing.toLocaleString()}` : '0';
            const marketingTier = this.getMarketingTierBadge(title.marketingTier);
            const region = title.region || 'US';
            
            row.innerHTML = `
                <td><input type="checkbox" class="title-checkbox" data-id="${title.id}"></td>
                <td><span class="ranking-badge">${index + 1}</span></td>
                <td>${title.titleId || title.id}</td>
                <td class="title-cell">${title.title}</td>
                <td class="author-cell">${title.author}</td>
                <td>${title.asin || 'N/A'}</td>
                <td><span class="status-badge">${title.status || 'In Development'}</span></td>
                <td>${releaseDate}</td>
                <td>${title.genre}</td>
                <td><span class="priority ${title.priority.toLowerCase()}">${title.priority}</span></td>
                <td>${marketingTier}</td>
                <td>${title.salesTier || 'Tier 4'}</td>
                <td>${title.pr || 'N/A'}</td>
                <td>${title.imprint || 'N/A'}</td>
                <td>${title.editor || 'N/A'}</td>
                <td>${title.amm || 'N/A'}</td>
                <td>${title.pubQuarter || 'N/A'}</td>
                <td>${title.selectionStrategy || 'N/A'}</td>
                <td><span class="social-count">${socialFollowing}</span></td>
                <td>${audioIndicator}</td>
                <td>${videoIndicator}</td>
                <td>${region}</td>
                <td class="actions-cell">
                    <div class="table-actions">
                        <button class="btn-small btn-edit" onclick="app.openTitleModal(${JSON.stringify(title).replace(/"/g, '&quot;')})">Edit</button>
                        <button class="btn-small btn-plan" onclick="app.openPlanModal('${title.id}')">Plan</button>
                        <button class="btn-small" style="background: #FF3B30; color: white;" onclick="app.deleteTitle('${title.id}')">Del</button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    renderPlans() {
        const container = document.getElementById('plansContainer');
        container.innerHTML = '';

        const plansWithTitles = this.plans.map(plan => ({
            ...plan,
            title: this.titles.find(t => t.id === plan.titleId)
        })).filter(plan => plan.title);

        plansWithTitles.forEach(plan => {
            const card = document.createElement('div');
            card.className = 'plan-card';
            
            const campaignBadge = plan.campaignType ? `<span class="campaign-badge campaign-${plan.campaignType.toLowerCase()}">${plan.campaignType}</span>` : '';
            const regionBadges = plan.regions ? plan.regions.map(region => `<span class="region-badge">${region}</span>`).join('') : '';
            
            card.innerHTML = `
                <h3>${plan.title.title} - Marketing Plan</h3>
                <div class="campaign-info">
                    ${campaignBadge}
                    <div class="region-badges">${regionBadges}</div>
                </div>
                <div class="plan-summary">
                    <div class="plan-item">
                        <strong>Target Audience</strong>
                        ${plan.targetAudience || 'Not specified'}
                    </div>
                    <div class="plan-item">
                        <strong>Budget</strong>
                        ${plan.budget ? '$' + Number(plan.budget).toLocaleString() : 'Not specified'}
                    </div>
                    <div class="plan-item">
                        <strong>Marketing Channels</strong>
                        ${plan.marketingChannels?.join(', ') || 'Not specified'}
                    </div>
                    <div class="plan-item">
                        <strong>Team Members</strong>
                        ${plan.teamMembers || 'Not assigned'}
                    </div>
                </div>
                <div class="actions">
                    <button class="btn-small btn-edit" onclick="app.openPlanModal('${plan.titleId}')">Edit Plan</button>
                </div>
            `;
            
            container.appendChild(card);
        });

        if (plansWithTitles.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No marketing plans created yet. Add titles and create plans to get started.</p>';
        }
    }

    updateTitleFilter() {
        const filter = document.getElementById('titleFilter');
        filter.innerHTML = '<option value="">All Titles</option>';
        
        this.titles.forEach(title => {
            const option = document.createElement('option');
            option.value = title.id;
            option.textContent = title.title;
            filter.appendChild(option);
        });
    }

    filterPlans(titleId) {
        const cards = document.querySelectorAll('.plan-card');
        cards.forEach(card => {
            if (!titleId || card.querySelector('h3').textContent.includes(this.titles.find(t => t.id === titleId)?.title || '')) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    addActivity(message) {
        if (this.activityPaused) return;
        
        const activity = {
            id: Date.now().toString(),
            message: message,
            timestamp: new Date().toISOString(),
            user: this.currentUser,
            type: 'user_action'
        };
        
        this.activities.unshift(activity);
        this.activities = this.activities.slice(0, 100); // Keep more activities for dashboard
        
        // Update total actions counter
        document.getElementById('totalActions').textContent = this.activities.length;
        
        this.saveData();
        this.renderActivity();
    }

    renderActivity() {
        const feed = document.getElementById('activityFeed');
        feed.innerHTML = '';

        if (this.activities.length === 0) {
            feed.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No activity yet. Start by adding titles and creating marketing plans.</p>';
            return;
        }

        this.activities.forEach((activity, index) => {
            const item = document.createElement('div');
            item.className = `activity-item ${index < 3 ? 'recent' : ''}`;
            
            const timeAgo = this.getTimeAgo(new Date(activity.timestamp));
            const isCurrentUser = activity.user === this.currentUser;
            
            item.innerHTML = `
                <div class="activity-header">
                    <span class="activity-user ${isCurrentUser ? 'current-user' : ''}">
                        ${activity.user || 'Unknown User'}
                        ${isCurrentUser ? ' (You)' : ''}
                    </span>
                    <span class="activity-time">${timeAgo}</span>
                    <span class="activity-indicator live">●</span>
                </div>
                <div class="activity-message">${activity.message}</div>
            `;
            
            feed.appendChild(item);
        });
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    calculateRankingScore(data) {
        let score = 0;
        
        // Priority scoring (30 points max)
        if (data.priority === 'High') score += 30;
        else if (data.priority === 'Medium') score += 20;
        else if (data.priority === 'Low') score += 10;
        
        // Audio success scoring (25 points max)
        if (data.audioSuccess === 'High') score += 25;
        else if (data.audioSuccess === 'Medium') score += 15;
        else if (data.audioSuccess === 'Low') score += 5;
        
        // Social following scoring (25 points max)
        const followers = data.socialFollowing || 0;
        if (followers >= 100000) score += 25;
        else if (followers >= 50000) score += 20;
        else if (followers >= 10000) score += 15;
        else if (followers >= 1000) score += 10;
        else if (followers > 0) score += 5;
        
        // Video comfort scoring (20 points max)
        if (data.videoComfort === 'High') score += 20;
        else if (data.videoComfort === 'Medium') score += 15;
        else if (data.videoComfort === 'Low') score += 5;
        
        return Math.round(score);
    }
    
    getAudioIndicator(audioSuccess) {
        if (!audioSuccess || audioSuccess === 'None') return '';
        return `<span class="audio-indicator audio-${audioSuccess.toLowerCase()}">🎧 ${audioSuccess} Audio</span>`;
    }
    
    getVideoIndicator(videoComfort) {
        if (!videoComfort || videoComfort === 'None') return '';
        return `<span class="video-indicator video-${videoComfort.toLowerCase()}">📹 ${videoComfort} Video</span>`;
    }
    
    updateAllocation() {
        this.allocation.marqueeTotal = parseInt(document.getElementById('setMarqueeTotal').value) || 12;
        this.allocation.blockbusterTotal = parseInt(document.getElementById('setBlockbusterTotal').value) || 6;
        this.saveData();
        this.renderAllocation();
        this.addActivity(`${this.currentUser} updated campaign allocation limits`);
    }
    
    loadAllocationSettings() {
        document.getElementById('setMarqueeTotal').value = this.allocation.marqueeTotal;
        document.getElementById('setBlockbusterTotal').value = this.allocation.blockbusterTotal;
    }
    
    renderAllocation() {
        const marqueeUsed = this.plans.filter(p => p.campaignType === 'Marquee').length;
        const blockbusterUsed = this.plans.filter(p => p.campaignType === 'Blockbuster').length;
        
        document.getElementById('marqueeUsed').textContent = marqueeUsed;
        document.getElementById('marqueeTotal').textContent = this.allocation.marqueeTotal;
        document.getElementById('blockbusterUsed').textContent = blockbusterUsed;
        document.getElementById('blockbusterTotal').textContent = this.allocation.blockbusterTotal;
        
        // Update progress bars
        const marqueePercent = (marqueeUsed / this.allocation.marqueeTotal) * 100;
        const blockbusterPercent = (blockbusterUsed / this.allocation.blockbusterTotal) * 100;
        
        const marqueeBar = document.getElementById('marqueeBar');
        const blockbusterBar = document.getElementById('blockbusterBar');
        
        marqueeBar.style.width = `${Math.min(marqueePercent, 100)}%`;
        blockbusterBar.style.width = `${Math.min(blockbusterPercent, 100)}%`;
        
        // Update bar colors based on usage
        marqueeBar.className = 'progress-bar';
        blockbusterBar.className = 'progress-bar';
        
        if (marqueePercent >= 100) marqueeBar.classList.add('danger');
        else if (marqueePercent >= 80) marqueeBar.classList.add('warning');
        
        if (blockbusterPercent >= 100) blockbusterBar.classList.add('danger');
        else if (blockbusterPercent >= 80) blockbusterBar.classList.add('warning');
    }
    
    async saveData() {
        // Save to localStorage as backup
        localStorage.setItem('titles', JSON.stringify(this.titles));
        localStorage.setItem('plans', JSON.stringify(this.plans));
        localStorage.setItem('activities', JSON.stringify(this.activities));
        localStorage.setItem('allocation', JSON.stringify(this.allocation));
        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
        
        // Real-time sync
        if (window.realtimeSync) {
            await window.realtimeSync.syncData('titles', this.titles);
            await window.realtimeSync.syncData('plans', this.plans);
            await window.realtimeSync.syncData('activities', this.activities);
            await window.realtimeSync.syncData('allocation', this.allocation);
        }
        
        // Update dashboard
        this.renderDashboard();
    }

    exportData() {
        const data = {
            titles: this.titles,
            plans: this.plans,
            activities: this.activities,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '2026-title-planning-data.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    getMarketingTierBadge(tier) {
        if (!tier) return '<span class="marketing-tier-badge tier-none">None</span>';
        return `<span class="marketing-tier-badge tier-${tier.toLowerCase()}">${tier}</span>`;
    }
    
    async handleExcelImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const data = await this.readExcelFile(file);
            this.processExcelData(data);
            this.addActivity(`${this.currentUser} imported data from ${file.name}`);
        } catch (error) {
            alert('Error importing Excel file: ' + error.message);
        }
    }
    
    async readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    resolve(this.parseExcelData(jsonData));
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }
    
    parseExcelData(rawData) {
        if (rawData.length < 2) return [];
        
        const headers = rawData[0].map(h => h?.toString().toLowerCase().trim());
        const rows = rawData.slice(1);
        
        return rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                const value = row[index];
                
                // Map columns by position for specific fields
                if (index === 0) {
                    obj.titleId = value; // Column A
                } else if (index === 9) {
                    obj.pr = value; // Column J
                } else if (index === 10) {
                    obj.imprint = value; // Column K
                } else if (header.includes('title_id') || header.includes('titleid')) {
                    obj.titleId = value;
                } else if (header.includes('title') || header.includes('book')) {
                    obj.title = value;
                } else if (header.includes('author_first')) {
                    obj.authorFirst = value;
                } else if (header.includes('author_last')) {
                    obj.authorLast = value;
                } else if (header.includes('author') || header.includes('writer')) {
                    obj.author = value;
                } else if (header.includes('asin')) {
                    obj.asin = value;
                } else if (header.includes('status')) {
                    obj.status = value;
                } else if (header.includes('date') || header.includes('release') || header.includes('pub')) {
                    obj.releaseDate = this.parseDate(value);
                } else if (header.includes('genre') || header.includes('category')) {
                    obj.genre = value;
                } else if (header.includes('priority') || header.includes('tier')) {
                    obj.priority = value;
                } else if (header.includes('sales_tier') || header.includes('salestier')) {
                    obj.salesTier = value;
                } else if (header.includes('editor')) {
                    obj.editor = value;
                } else if (header.includes('amm')) {
                    obj.amm = value;
                } else if (header.includes('quarter')) {
                    obj.pubQuarter = value;
                } else if (header.includes('selection') || header.includes('strategy')) {
                    obj.selectionStrategy = value;
                } else if (header.includes('region') || header.includes('market')) {
                    obj.region = value;
                } else if (header.includes('audio')) {
                    obj.audioSuccess = value;
                } else if (header.includes('video')) {
                    obj.videoComfort = value;
                } else if (header.includes('social') || header.includes('following')) {
                    obj.socialFollowing = parseInt(value) || 0;
                } else if (header.includes('sales') || header.includes('expected')) {
                    obj.expectedSales = parseInt(value) || 0;
                }
            });
            
            // Combine author first and last names if available
            if (obj.authorFirst && obj.authorLast) {
                obj.author = `${obj.authorFirst} ${obj.authorLast}`;
            }
            
            return obj;
        }).filter(obj => obj.title && (obj.author || (obj.authorFirst && obj.authorLast))); // Only include rows with title and author
    }
    
    processExcelData(data) {
        let importedCount = 0;
        
        data.forEach(row => {
            // Check if title already exists
            const existingTitle = this.titles.find(t => 
                t.title.toLowerCase() === row.title?.toLowerCase() && 
                t.author.toLowerCase() === row.author?.toLowerCase()
            );
            
            if (!existingTitle) {
                const titleData = {
                    id: Date.now().toString() + Math.random(),
                    titleId: row.titleId || Date.now().toString() + Math.random(),
                    title: row.title || 'Untitled',
                    author: row.author || (row.authorFirst && row.authorLast ? `${row.authorFirst} ${row.authorLast}` : 'Unknown Author'),
                    asin: row.asin || '',
                    status: row.status || 'In Development',
                    releaseDate: row.releaseDate || '2026-01-01',
                    genre: row.genre || 'Fiction',
                    priority: this.determinePriority(row),
                    marketingTier: this.determineMarketingTier(row),
                    salesTier: row.salesTier || 'Tier 4',
                    pr: row.pr || '',
                    imprint: row.imprint || 'Random House',
                    editor: row.editor || '',
                    amm: row.amm || '',
                    pubQuarter: row.pubQuarter || this.getQuarterFromDate(row.releaseDate || '2026-01-01'),
                    selectionStrategy: row.selectionStrategy || 'Data-Driven',
                    socialFollowing: row.socialFollowing || this.getSocialFollowing(row.author || `${row.authorFirst} ${row.authorLast}`),
                    audioSuccess: row.audioSuccess || 'None',
                    videoComfort: row.videoComfort || 'None',
                    region: row.region || 'US',
                    editorialReason: row.editorialReason || '',
                    createdBy: this.currentUser,
                    createdAt: new Date().toISOString(),
                    rankingScore: 0
                };
                
                // Calculate ranking score after all data is set
        titleData.rankingScore = this.calculateRankingScore(titleData);
        
        // Auto-populate social following if not provided
        if (!titleData.socialFollowing) {
            titleData.socialFollowing = this.getSocialFollowing(titleData.author);
        }
                this.titles.push(titleData);
                importedCount++;
            }
        });
        
        this.saveData();
        this.renderTitles();
        this.updateTitleFilter();
        
        alert(`Successfully imported ${importedCount} new titles from Excel file.`);
    }
    
    determinePriority(row) {
        // Logic to determine priority based on various factors
        const tier2025Data = this.get2025TierData(row.author);
        const socialFollowing = row.socialFollowing || this.getSocialFollowing(row.author);
        
        // High priority criteria
        if (tier2025Data?.performance === 'High' || 
            socialFollowing >= 500000 || 
            row.expectedSales >= 50000 ||
            row.authorTier === 'A') {
            return 'High';
        }
        
        // Medium priority criteria
        if (tier2025Data?.performance === 'Medium' || 
            socialFollowing >= 100000 || 
            row.expectedSales >= 20000 ||
            row.authorTier === 'B') {
            return 'Medium';
        }
        
        return 'Low';
    }
    
    determineMarketingTier(row) {
        // Cross-reference with 2025 data to determine marketing tier
        const author = row.author;
        const tier2025Data = this.get2025TierData(author);
        const socialFollowing = row.socialFollowing || this.getSocialFollowing(author);
        
        // Scoring system for tier determination
        let score = 0;
        
        // Previous tier performance (40% weight)
        if (tier2025Data?.tier === 'Mega Blockbuster') score += 50;
        else if (tier2025Data?.tier === 'Marquee Me') score += 40;
        else if (tier2025Data?.tier === 'Marquee Mini') score += 35;
        else if (tier2025Data?.tier === 'BPub/Audio') score += 25;
        else if (tier2025Data?.tier === 'Author Branding') score += 20;
        else if (tier2025Data?.tier === 'Gold Books') score += 15;
        else if (tier2025Data?.tier === 'Momentum') score += 10;
        
        // Social following (30% weight)
        if (socialFollowing >= 1000000) score += 30;
        else if (socialFollowing >= 500000) score += 25;
        else if (socialFollowing >= 100000) score += 20;
        else if (socialFollowing >= 50000) score += 10;
        
        // Expected sales (20% weight)
        if (row.expectedSales >= 100000) score += 20;
        else if (row.expectedSales >= 50000) score += 15;
        else if (row.expectedSales >= 20000) score += 10;
        else if (row.expectedSales >= 10000) score += 5;
        
        // Audio/Video performance (10% weight)
        if (row.audioSuccess === 'High' && row.videoComfort === 'High') score += 10;
        else if (row.audioSuccess === 'High' || row.videoComfort === 'High') score += 5;
        
        // Determine tier based on score
        if (score >= 80) return 'Mega Blockbuster';
        if (score >= 65) return 'Marquee Me';
        if (score >= 50) return 'Marquee Mini';
        if (score >= 35) return 'BPub/Audio';
        if (score >= 25) return 'Author Branding';
        if (score >= 15) return 'Gold Books';
        return 'Momentum';
    }
    
    getQuarterFromDate(dateString) {
        if (!dateString) return 'Q1 2026';
        const date = new Date(dateString);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        
        if (month <= 3) return `Q1 ${year}`;
        if (month <= 6) return `Q2 ${year}`;
        if (month <= 9) return `Q3 ${year}`;
        return `Q4 ${year}`;
    }
    
    get2025TierData(author) {
        // Simulate cross-referencing with IN+PROGRESS+full+2025+Title+Planning.xlsx
        const mockData = {
            'Rebecca Yarros': { tier: 'Mega Blockbuster', performance: 'High', previousBudget: 200000 },
            'Colleen Hoover': { tier: 'Mega Blockbuster', performance: 'High', previousBudget: 250000 },
            'Taylor Jenkins Reid': { tier: 'Marquee Me', performance: 'High', previousBudget: 150000 },
            'Alice Hoffman': { tier: 'Marquee Mini', performance: 'Medium', previousBudget: 100000 },
            'Lucinda Berry': { tier: 'BPub/Audio', performance: 'Medium', previousBudget: 50000 },
            'Melissa de la Cruz': { tier: 'Author Branding', performance: 'High', previousBudget: 75000 },
            'Andrew Sean Greer': { tier: 'Gold Books', performance: 'Medium', previousBudget: 40000 },
            'Elin Hilderbrand': { tier: 'Momentum', performance: 'High', previousBudget: 30000 }
        };
        return mockData[author];
    }
    
    getSocialFollowing(author) {
        // Simulate AI/Cedric social following lookup
        // In production, this would make an API call to Amazon Q or Cedric
        const mockFollowing = {
            'Rebecca Yarros': 850000,
            'Colleen Hoover': 1200000,
            'Taylor Jenkins Reid': 650000,
            'Alice Hoffman': 320000,
            'Lucinda Berry': 180000,
            'Melissa de la Cruz': 420000,
            'Andrew Sean Greer': 95000,
            'Elin Hilderbrand': 280000
        };
        
        // If author not in mock data, generate based on name hash for consistency
        if (!mockFollowing[author]) {
            const hash = author.split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
            }, 0);
            return Math.abs(hash) % 500000 + 10000; // Random but consistent following between 10K-510K
        }
        
        return mockFollowing[author];
    }
    
    initializeChatbot() {
        this.loadChatHistory();
    }
    
    loadChatHistory() {
        const chatMessages = document.getElementById('chatMessages');
        // Keep the initial bot message and add any saved history
        this.chatHistory.forEach(message => {
            if (message.type !== 'initial') {
                this.displayChatMessage(message.content, message.type === 'user');
            }
        });
    }
    
    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.displayChatMessage(message, true);
        this.chatHistory.push({ type: 'user', content: message, timestamp: new Date().toISOString() });
        
        input.value = '';
        
        // Simulate AI response
        setTimeout(() => {
            const response = this.generateAIResponse(message);
            this.displayChatMessage(response, false);
            this.chatHistory.push({ type: 'bot', content: response, timestamp: new Date().toISOString() });
            this.saveData();
        }, 1000);
    }
    
    displayChatMessage(message, isUser) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isUser ? 'user-message' : 'bot-message'}`;
        
        messageDiv.innerHTML = `
            <div class="message-content">
                ${isUser ? '' : '<strong>AI Assistant:</strong> '}${message}
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    generateAIResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('marketing tier') || lowerMessage.includes('tier recommendation')) {
            return this.getMarketingTierAdvice();
        }
        
        if (lowerMessage.includes('social') || lowerMessage.includes('following')) {
            return this.getSocialMediaAdvice();
        }
        
        if (lowerMessage.includes('budget') || lowerMessage.includes('allocation')) {
            return this.getBudgetAdvice();
        }
        
        if (lowerMessage.includes('genre') || lowerMessage.includes('category')) {
            return this.getGenreAdvice();
        }
        
        if (lowerMessage.includes('timing') || lowerMessage.includes('schedule')) {
            return this.getTimingAdvice();
        }
        
        return this.getGeneralAdvice();
    }
    
    getMarketingTierAdvice() {
        const marqueeCount = this.plans.filter(p => p.campaignType === 'Marquee').length;
        const blockbusterCount = this.plans.filter(p => p.campaignType === 'Blockbuster').length;
        
        return `Based on your current allocation, you have ${this.allocation.marqueeTotal - marqueeCount} Marquee slots and ${this.allocation.blockbusterTotal - blockbusterCount} Blockbuster slots remaining. For marketing tier recommendations:

• **Marquee**: Authors with 500K+ social following, proven track record, or high pre-order numbers
• **Blockbuster**: Established authors with 100K+ following or strong genre performance
• **Standard**: New or emerging authors, or titles with limited marketing budget

Consider factors like audio performance, video content comfort, and previous title success when making tier decisions.`;
    }
    
    getSocialMediaAdvice() {
        const avgFollowing = this.titles.reduce((sum, title) => sum + (title.socialFollowing || 0), 0) / this.titles.length;
        
        return `Your titles have an average social following of ${Math.round(avgFollowing).toLocaleString()}. Here are some social media strategies:

• **High Following (500K+)**: Leverage author's existing audience with exclusive content, live events, and user-generated campaigns
• **Medium Following (50K-500K)**: Focus on engagement-driven content, collaborations, and targeted advertising
• **Low Following (<50K)**: Invest in community building, influencer partnerships, and organic growth strategies

Consider the author's video comfort level when planning TikTok and Instagram Reels campaigns.`;
    }
    
    getBudgetAdvice() {
        const totalBudget = this.plans.reduce((sum, plan) => sum + (parseInt(plan.budget) || 0), 0);
        
        return `Current total allocated budget: $${totalBudget.toLocaleString()}. Budget allocation recommendations:

• **Marquee campaigns**: $50K-$150K (focus on broad reach, premium placements)
• **Blockbuster campaigns**: $20K-$50K (targeted advertising, influencer partnerships)
• **Standard campaigns**: $5K-$20K (organic social, email marketing, basic advertising)

Allocate 40% to paid advertising, 30% to influencer/PR, 20% to content creation, and 10% to events/activations.`;
    }
    
    getGenreAdvice() {
        const genreCounts = this.titles.reduce((acc, title) => {
            acc[title.genre] = (acc[title.genre] || 0) + 1;
            return acc;
        }, {});
        
        const topGenre = Object.keys(genreCounts).reduce((a, b) => genreCounts[a] > genreCounts[b] ? a : b);
        
        return `Your most common genre is ${topGenre} with ${genreCounts[topGenre]} titles. Genre-specific strategies:

• **Romance**: Focus on BookTok, Instagram aesthetics, and emotional marketing
• **Fiction**: Emphasize storytelling, book clubs, and literary communities
• **Non-Fiction**: Target specific interest groups, thought leadership, and educational content
• **Mystery**: Build suspense in marketing, engage mystery communities, and use serialized content

Consider cross-genre appeal and seasonal timing for maximum impact.`;
    }
    
    getTimingAdvice() {
        const releaseMonths = this.titles.map(title => new Date(title.releaseDate).getMonth());
        const busyMonths = releaseMonths.reduce((acc, month) => {
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {});
        
        return `Release timing considerations:

• **Spring (Mar-May)**: Great for romance and lighter fiction
• **Summer (Jun-Aug)**: Beach reads, young adult, and vacation-friendly titles
• **Fall (Sep-Nov)**: Literary fiction, book club picks, and holiday gift books
• **Winter (Dec-Feb)**: New Year themes, cozy reads, and resolution-focused non-fiction

Avoid clustering too many high-priority titles in the same month. Consider coordinating with major book events and holidays.`;
    }
    
    getGeneralAdvice() {
        return `I can help you with various aspects of title planning and marketing:

• **Marketing tier recommendations** based on author performance and social following
• **Budget allocation strategies** for different campaign types
• **Social media strategies** tailored to author platforms and audience
• **Genre-specific marketing approaches** for maximum impact
• **Release timing optimization** to avoid conflicts and maximize visibility

What specific area would you like to explore further?`;
    }
    
    clearChat() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="chat-message bot-message">
                <div class="message-content">
                    <strong>AI Assistant:</strong> Chat cleared. How can I help you with your 2026 title planning?
                </div>
            </div>
        `;
        this.chatHistory = [];
        this.saveData();
    }
    
    parseDate(value) {
        if (!value) return '2026-01-01';
        
        // Handle Excel date serial numbers
        if (typeof value === 'number') {
            const date = new Date((value - 25569) * 86400 * 1000);
            return date.toISOString().split('T')[0];
        }
        
        // Handle string dates
        if (typeof value === 'string') {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        }
        
        return '2026-01-01';
    }
    
    loadSampleData() {
        // Load sample data if no titles exist
        if (this.titles.length === 0) {
            const sampleTitles = [
                {
                    id: '1',
                    titleId: 'TIT-2026-001',
                    title: 'Fourth Wing',
                    author: 'Rebecca Yarros',
                    asin: 'B0B123456X',
                    status: 'Ready for Launch',
                    releaseDate: '2026-03-15',
                    genre: 'Romance',
                    priority: 'High',
                    marketingTier: 'Mega Blockbuster',
                    salesTier: 'Tier 1',
                    pr: 'Sarah Johnson',
                    imprint: 'Ballantine',
                    editor: 'Jennifer Smith',
                    amm: 'Lisa Chen',
                    pubQuarter: 'Q1 2026',
                    selectionStrategy: 'Data-Driven',
                    socialFollowing: 850000,
                    audioSuccess: 'High',
                    videoComfort: 'High',
                    region: 'US',
                    editorialReason: 'Proven bestselling author with massive social following',
                    createdBy: 'System',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    titleId: 'TIT-2026-002',
                    title: 'It Starts with Us',
                    author: 'Colleen Hoover',
                    asin: 'B0B789012Y',
                    status: 'In Production',
                    releaseDate: '2026-06-20',
                    genre: 'Romance',
                    priority: 'High',
                    marketingTier: 'Mega Blockbuster',
                    salesTier: 'Tier 1',
                    pr: 'Michael Davis',
                    imprint: 'Bantam',
                    editor: 'Amanda Wilson',
                    amm: 'Rachel Green',
                    pubQuarter: 'Q2 2026',
                    selectionStrategy: 'Editorial Choice',
                    socialFollowing: 1200000,
                    audioSuccess: 'High',
                    videoComfort: 'Medium',
                    region: 'UK',
                    editorialReason: 'Bestselling romance author with dedicated fanbase',
                    createdBy: 'System',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '3',
                    titleId: 'TIT-2026-003',
                    title: 'Der Schatten des Windes',
                    author: 'Carlos Ruiz Zafón',
                    asin: 'B0B345678Z',
                    status: 'In Development',
                    releaseDate: '2026-09-10',
                    genre: 'Fiction',
                    priority: 'Medium',
                    marketingTier: 'Marquee Mini',
                    salesTier: 'Tier 2',
                    pr: 'Klaus Mueller',
                    imprint: 'Crown',
                    editor: 'Hans Weber',
                    amm: 'Petra Schmidt',
                    pubQuarter: 'Q3 2026',
                    selectionStrategy: 'Market Opportunity',
                    socialFollowing: 250000,
                    audioSuccess: 'Medium',
                    videoComfort: 'Low',
                    region: 'DE',
                    editorialReason: 'Popular European author with strong German market presence',
                    createdBy: 'System',
                    createdAt: new Date().toISOString()
                }
            ];
            
            sampleTitles.forEach(title => {
                title.rankingScore = this.calculateRankingScore(title);
                this.titles.push(title);
            });
            
            this.saveData();
        }
    }
    
    bulkDeleteTitles() {
        const checkboxes = document.querySelectorAll('.title-checkbox');
        const selectedIds = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.dataset.id);
            
        if (selectedIds.length === 0) {
            alert('Please select titles to delete');
            return;
        }
        
        if (confirm(`Delete ${selectedIds.length} selected titles? This cannot be undone.`)) {
            this.titles = this.titles.filter(t => !selectedIds.includes(t.id));
            this.plans = this.plans.filter(p => !selectedIds.includes(p.titleId));
            
            this.addActivity(`${this.currentUser} bulk deleted ${selectedIds.length} titles`);
            this.saveData();
            this.renderTitles();
            this.renderPlans();
            this.updateTitleFilter();
            
            document.getElementById('selectAll').checked = false;
        }
    }
    
    toggleSelectAll(checked) {
        document.querySelectorAll('.title-checkbox').forEach(cb => {
            cb.checked = checked;
        });
    }
    
    populateFilterOptions() {
        const genres = [...new Set(this.titles.map(t => t.genre))].sort();
        const priorities = ['High', 'Medium', 'Low'];
        const tiers = ['Mega Blockbuster', 'Marquee Me', 'Marquee Mini', 'BPub/Audio', 'Author Branding', 'Gold Books', 'Momentum'];
        const regions = [...new Set(this.titles.map(t => t.region))].sort();
        
        this.populateSelect('genreFilter', genres);
        this.populateSelect('priorityFilter', priorities);
        this.populateSelect('tierFilter', tiers);
        this.populateSelect('regionFilter', regions);
    }
    
    populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
        const currentValue = select.value;
        select.innerHTML = `<option value="">${select.options[0].text}</option>`;
        options.forEach(option => {
            if (option) {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                select.appendChild(opt);
            }
        });
        select.value = currentValue;
    }
    
    applyFilters() {
        const titleSearch = document.getElementById('titleSearch').value.toLowerCase();
        const authorSearch = document.getElementById('authorSearch').value.toLowerCase();
        const dateFilter = document.getElementById('dateFilter').value;
        const genreFilter = document.getElementById('genreFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;
        const tierFilter = document.getElementById('tierFilter').value;
        const regionFilter = document.getElementById('regionFilter').value;
        
        const rows = document.querySelectorAll('#titlesTableBody tr');
        rows.forEach(row => {
            const title = row.cells[3].textContent.toLowerCase();
            const author = row.cells[4].textContent.toLowerCase();
            const date = row.cells[7].textContent;
            const genre = row.cells[8].textContent;
            const priority = row.cells[9].textContent;
            const tier = row.cells[10].textContent;
            const pr = row.cells[12].textContent.toLowerCase();
            const imprint = row.cells[13].textContent.toLowerCase();
            const editor = row.cells[14].textContent.toLowerCase();
            const amm = row.cells[15].textContent.toLowerCase();
            const region = row.cells[21].textContent;
            
            const matchesTitle = !titleSearch || title.includes(titleSearch) || pr.includes(titleSearch) || imprint.includes(titleSearch) || editor.includes(titleSearch) || amm.includes(titleSearch);
            const matchesAuthor = !authorSearch || author.includes(authorSearch);
            const matchesDate = !dateFilter || date.includes(dateFilter);
            const matchesGenre = !genreFilter || genre === genreFilter;
            const matchesPriority = !priorityFilter || priority === priorityFilter;
            const matchesTier = !tierFilter || tier.includes(tierFilter);
            const matchesRegion = !regionFilter || region === regionFilter;
            
            row.style.display = matchesTitle && matchesAuthor && matchesDate && matchesGenre && matchesPriority && matchesTier && matchesRegion ? '' : 'none';
        });
    }
    
    clearFilters() {
        document.getElementById('titleSearch').value = '';
        document.getElementById('authorSearch').value = '';
        document.getElementById('dateFilter').value = '';
        document.getElementById('genreFilter').value = '';
        document.getElementById('priorityFilter').value = '';
        document.getElementById('tierFilter').value = '';
        document.getElementById('regionFilter').value = '';
        this.applyFilters();
    }
}

// Initialize the dashboard
const app = new TitlePlanningDashboard();

// Excel processing is now handled by SheetJS library loaded via CDN
// The app can now properly import and process Excel files with title data