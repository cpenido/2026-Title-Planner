// Real Cloud Sync using GitHub Gist API
class RealCloudSync {
    constructor() {
        this.gistId = null;
        this.lastSync = 0;
        this.syncInterval = 2000; // 2 seconds
        this.storageKey = 'title-planner-gist-id';
        
        this.initializeGist();
        this.startSyncLoop();
    }
    
    async initializeGist() {
        // Try to get existing gist ID from localStorage
        this.gistId = localStorage.getItem(this.storageKey);
        
        if (!this.gistId) {
            // Create new gist for this session
            await this.createNewGist();
        }
    }
    
    async createNewGist() {
        try {
            const response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: '2026 Title Planning Dashboard Data',
                    public: false,
                    files: {
                        'dashboard-data.json': {
                            content: JSON.stringify({
                                titles: [],
                                plans: [],
                                activities: [],
                                allocation: { marqueeTotal: 12, blockbusterTotal: 6 },
                                chatHistory: [],
                                lastUpdate: Date.now(),
                                updatedBy: 'System'
                            })
                        }
                    }
                })
            });
            
            if (response.ok) {
                const gist = await response.json();
                this.gistId = gist.id;
                localStorage.setItem(this.storageKey, this.gistId);
                console.log('Created new gist:', this.gistId);
            }
        } catch (error) {
            console.log('Failed to create gist:', error.message);
        }
    }
    
    async saveToCloud(data) {
        if (!this.gistId) return false;
        
        try {
            const payload = {
                ...data,
                lastUpdate: Date.now(),
                syncVersion: this.generateSyncVersion()
            };
            
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    files: {
                        'dashboard-data.json': {
                            content: JSON.stringify(payload)
                        }
                    }
                })
            });
            
            if (response.ok) {
                this.lastSync = payload.lastUpdate;
                return true;
            }
            
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            console.log('Cloud save failed:', error.message);
            return false;
        }
    }
    
    async loadFromCloud() {
        if (!this.gistId) return null;
        
        try {
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`);
            
            if (response.ok) {
                const gist = await response.json();
                const content = gist.files['dashboard-data.json'].content;
                return JSON.parse(content);
            }
            
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            console.log('Cloud load failed:', error.message);
            return null;
        }
    }
    
    startSyncLoop() {
        setInterval(async () => {
            const cloudData = await this.loadFromCloud();
            if (cloudData && cloudData.lastUpdate > this.lastSync) {
                this.notifyDataChange(cloudData);
                this.lastSync = cloudData.lastUpdate;
            }
        }, this.syncInterval);
    }
    
    notifyDataChange(data) {
        window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: data }));
    }
    
    generateSyncVersion() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getConnectionStatus() {
        return {
            online: !!this.gistId,
            gistId: this.gistId,
            lastSync: this.lastSync
        };
    }
    
    // Share gist ID with other users
    getShareableId() {
        return this.gistId;
    }
    
    // Join existing session with gist ID
    joinSession(gistId) {
        this.gistId = gistId;
        localStorage.setItem(this.storageKey, gistId);
        console.log('Joined session:', gistId);
    }
}

// Initialize real cloud sync
window.realCloudSync = new RealCloudSync();