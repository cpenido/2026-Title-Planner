class TitlePlanningTool {
    constructor() {
        this.titles = JSON.parse(localStorage.getItem('titles')) || [];
        this.plans = JSON.parse(localStorage.getItem('plans')) || [];
        this.activities = JSON.parse(localStorage.getItem('activities')) || [];
        this.currentUser = localStorage.getItem('currentUser') || '';
        this.allocation = JSON.parse(localStorage.getItem('allocation')) || {
            marqueeTotal: 12,
            blockbusterTotal: 6
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserInfo();
        this.renderTitles();
        this.renderPlans();
        this.renderActivity();
        this.updateTitleFilter();
        this.renderAllocation();
        this.loadAllocationSettings();
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
            });
        });

        // Title filter
        document.getElementById('titleFilter').addEventListener('change', (e) => this.filterPlans(e.target.value));

        // Allocation management
        document.getElementById('updateAllocation').addEventListener('click', () => this.updateAllocation());

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
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
            document.getElementById('bookTitle').value = title.title;
            document.getElementById('author').value = title.author;
            document.getElementById('releaseDate').value = title.releaseDate;
            document.getElementById('genre').value = title.genre;
            document.getElementById('priority').value = title.priority;
            document.getElementById('audioSuccess').value = title.audioSuccess || 'None';
            document.getElementById('socialFollowing').value = title.socialFollowing || '';
            document.getElementById('videoComfort').value = title.videoComfort || 'None';
            document.getElementById('editorialReason').value = title.editorialReason || '';
        } else {
            document.getElementById('modalTitle').textContent = 'Add New Title';
            form.reset();
            document.getElementById('titleId').value = '';
        }
        
        modal.style.display = 'block';
    }

    closeTitleModal() {
        document.getElementById('titleModal').style.display = 'none';
    }

    saveTitle(e) {
        e.preventDefault();
        
        const titleData = {
            id: document.getElementById('titleId').value || Date.now().toString(),
            title: document.getElementById('bookTitle').value,
            author: document.getElementById('author').value,
            releaseDate: document.getElementById('releaseDate').value,
            genre: document.getElementById('genre').value,
            priority: document.getElementById('priority').value,
            audioSuccess: document.getElementById('audioSuccess').value,
            socialFollowing: parseInt(document.getElementById('socialFollowing').value) || 0,
            videoComfort: document.getElementById('videoComfort').value,
            editorialReason: document.getElementById('editorialReason').value,
            createdBy: this.currentUser,
            createdAt: new Date().toISOString(),
            rankingScore: this.calculateRankingScore({
                priority: document.getElementById('priority').value,
                audioSuccess: document.getElementById('audioSuccess').value,
                socialFollowing: parseInt(document.getElementById('socialFollowing').value) || 0,
                videoComfort: document.getElementById('videoComfort').value
            })
        };

        const existingIndex = this.titles.findIndex(t => t.id === titleData.id);
        if (existingIndex >= 0) {
            this.titles[existingIndex] = { ...this.titles[existingIndex], ...titleData };
            this.addActivity(`${this.currentUser} updated "${titleData.title}"`);
        } else {
            this.titles.push(titleData);
            this.addActivity(`${this.currentUser} added new title "${titleData.title}"`);
        }

        this.saveData();
        this.renderTitles();
        this.updateTitleFilter();
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
        const grid = document.getElementById('titlesGrid');
        grid.innerHTML = '';

        // Sort titles by ranking score (highest first)
        const sortedTitles = [...this.titles].sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0));

        sortedTitles.forEach(title => {
            const card = document.createElement('div');
            card.className = 'title-card';
            
            const releaseDate = new Date(title.releaseDate).toLocaleDateString();
            const audioIndicator = this.getAudioIndicator(title.audioSuccess);
            const videoIndicator = this.getVideoIndicator(title.videoComfort);
            const socialFollowing = title.socialFollowing ? `${title.socialFollowing.toLocaleString()} followers` : 'No data';
            
            card.innerHTML = `
                <div class="ranking-score">${title.rankingScore || 0}</div>
                <h3>${title.title}</h3>
                <div class="author">by ${title.author}</div>
                <div class="meta">
                    <span class="date">${releaseDate}</span>
                    <span class="priority ${title.priority.toLowerCase()}">${title.priority}</span>
                </div>
                <div class="genre">${title.genre}</div>
                <div class="indicators">
                    ${audioIndicator}
                    ${videoIndicator}
                </div>
                <div class="social-following">📱 ${socialFollowing}</div>
                ${title.editorialReason ? `<div class="editorial-reason">${title.editorialReason}</div>` : ''}
                <div class="actions">
                    <button class="btn-small btn-edit" onclick="app.openTitleModal(${JSON.stringify(title).replace(/"/g, '&quot;')})">Edit</button>
                    <button class="btn-small btn-plan" onclick="app.openPlanModal('${title.id}')">Plan</button>
                    <button class="btn-small" style="background: #FF3B30; color: white;" onclick="app.deleteTitle('${title.id}')">Delete</button>
                </div>
            `;
            
            grid.appendChild(card);
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
        const activity = {
            id: Date.now().toString(),
            message: message,
            timestamp: new Date().toISOString(),
            user: this.currentUser
        };
        
        this.activities.unshift(activity);
        this.activities = this.activities.slice(0, 50); // Keep only last 50 activities
        
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

        this.activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            
            const timeAgo = this.getTimeAgo(new Date(activity.timestamp));
            
            item.innerHTML = `
                <div>
                    <span class="activity-user">${activity.user || 'Unknown User'}</span>
                    <span class="activity-time">${timeAgo}</span>
                </div>
                <div>${activity.message}</div>
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
    
    saveData() {
        localStorage.setItem('titles', JSON.stringify(this.titles));
        localStorage.setItem('plans', JSON.stringify(this.plans));
        localStorage.setItem('activities', JSON.stringify(this.activities));
        localStorage.setItem('allocation', JSON.stringify(this.allocation));
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
}

// Initialize the application
const app = new TitlePlanningTool();