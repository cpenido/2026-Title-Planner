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
        this.chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
        
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
        this.initializeChatbot();
        this.loadSampleData();
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
        
        // Excel import
        document.getElementById('importExcel').addEventListener('click', () => document.getElementById('excelImport').click());
        document.getElementById('excelImport').addEventListener('change', (e) => this.handleExcelImport(e));
        
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
            document.getElementById('marketingTier').value = title.marketingTier || '';
            document.getElementById('socialFollowing').value = title.socialFollowing || '';
            document.getElementById('videoComfort').value = title.videoComfort || 'None';
            document.getElementById('region').value = title.region || 'US';
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
            marketingTier: document.getElementById('marketingTier').value || this.determineMarketingTier({
                author: document.getElementById('author').value,
                socialFollowing: parseInt(document.getElementById('socialFollowing').value) || 0,
                audioSuccess: document.getElementById('audioSuccess').value,
                videoComfort: document.getElementById('videoComfort').value
            }),
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
                <td><span class="ranking-badge">${index + 1}</span></td>
                <td class="title-cell">${title.title}</td>
                <td class="author-cell">${title.author}</td>
                <td>${releaseDate}</td>
                <td>${title.genre}</td>
                <td><span class="priority ${title.priority.toLowerCase()}">${title.priority}</span></td>
                <td>${marketingTier}</td>
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
        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
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
                
                // Map common column names to our data structure
                if (header.includes('title') || header.includes('book')) {
                    obj.title = value;
                } else if (header.includes('author') || header.includes('writer')) {
                    obj.author = value;
                } else if (header.includes('date') || header.includes('release') || header.includes('pub')) {
                    obj.releaseDate = this.parseDate(value);
                } else if (header.includes('genre') || header.includes('category')) {
                    obj.genre = value;
                } else if (header.includes('priority') || header.includes('tier')) {
                    obj.priority = value;
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
            
            return obj;
        }).filter(obj => obj.title && obj.author); // Only include rows with title and author
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
                    title: row.title || 'Untitled',
                    author: row.author || 'Unknown Author',
                    releaseDate: row.releaseDate || '2026-01-01',
                    genre: row.genre || 'Fiction',
                    priority: this.determinePriority(row),
                    marketingTier: this.determineMarketingTier(row),
                    socialFollowing: row.socialFollowing || this.getSocialFollowing(row.author),
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
        if (tier2025Data?.tier === 'Marquee') score += 40;
        else if (tier2025Data?.tier === 'Blockbuster') score += 25;
        else if (tier2025Data?.tier === 'Standard') score += 10;
        
        // Social following (30% weight)
        if (socialFollowing >= 500000) score += 30;
        else if (socialFollowing >= 100000) score += 20;
        else if (socialFollowing >= 50000) score += 10;
        
        // Expected sales (20% weight)
        if (row.expectedSales >= 50000) score += 20;
        else if (row.expectedSales >= 20000) score += 12;
        else if (row.expectedSales >= 10000) score += 6;
        
        // Audio/Video performance (10% weight)
        if (row.audioSuccess === 'High' && row.videoComfort === 'High') score += 10;
        else if (row.audioSuccess === 'High' || row.videoComfort === 'High') score += 5;
        
        // Determine tier based on score
        if (score >= 70) return 'Marquee';
        if (score >= 40) return 'Blockbuster';
        return 'Standard';
    }
    
    get2025TierData(author) {
        // Simulate cross-referencing with IN+PROGRESS+full+2025+Title+Planning.xlsx
        const mockData = {
            'Rebecca Yarros': { tier: 'Marquee', performance: 'High', previousBudget: 150000 },
            'Colleen Hoover': { tier: 'Marquee', performance: 'High', previousBudget: 200000 },
            'Taylor Jenkins Reid': { tier: 'Blockbuster', performance: 'High', previousBudget: 75000 },
            'Alice Hoffman': { tier: 'Blockbuster', performance: 'Medium', previousBudget: 50000 },
            'Lucinda Berry': { tier: 'Standard', performance: 'Medium', previousBudget: 25000 },
            'Melissa de la Cruz': { tier: 'Blockbuster', performance: 'High', previousBudget: 60000 },
            'Andrew Sean Greer': { tier: 'Standard', performance: 'Medium', previousBudget: 20000 },
            'Elin Hilderbrand': { tier: 'Blockbuster', performance: 'High', previousBudget: 80000 }
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
                    title: 'Fourth Wing',
                    author: 'Rebecca Yarros',
                    releaseDate: '2026-03-15',
                    genre: 'Romance',
                    priority: 'High',
                    marketingTier: 'Marquee',
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
                    title: 'It Starts with Us',
                    author: 'Colleen Hoover',
                    releaseDate: '2026-06-20',
                    genre: 'Romance',
                    priority: 'High',
                    marketingTier: 'Marquee',
                    socialFollowing: 1200000,
                    audioSuccess: 'High',
                    videoComfort: 'Medium',
                    region: 'US',
                    editorialReason: 'Bestselling romance author with dedicated fanbase',
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
}

// Initialize the application
const app = new TitlePlanningTool();

// Excel processing is now handled by SheetJS library loaded via CDN
// The app can now properly import and process Excel files with title data