// Simple Multi-User Sync using localStorage broadcast
class CloudSync {
    constructor() {
        this.lastSync = 0;
        this.syncInterval = 1000; // 1 second
        this.storageKey = 'title-planner-shared-data';
        this.userKey = 'title-planner-user-' + Math.random().toString(36).substr(2, 9);
        
        this.startSyncLoop();
    }
    
    async saveToCloud(data) {
        try {
            const payload = {
                ...data,
                lastUpdate: Date.now(),
                syncVersion: this.generateSyncVersion(),
                savedBy: data.updatedBy || 'Unknown'
            };
            
            // Save to shared localStorage key
            localStorage.setItem(this.storageKey, JSON.stringify(payload));
            
            // Broadcast to other tabs/windows
            window.dispatchEvent(new StorageEvent('storage', {
                key: this.storageKey,
                newValue: JSON.stringify(payload),
                url: window.location.href
            }));
            
            this.lastSync = payload.lastUpdate;
            return true;
        } catch (error) {
            console.log('Save failed:', error.message);
            return false;
        }
    }
    
    async loadFromCloud() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.log('Load failed:', error.message);
            return null;
        }
    }
    
    startSyncLoop() {
        // Listen for storage changes from other tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue);
                    if (data.lastUpdate > this.lastSync && data.savedBy !== this.getCurrentUser()) {
                        this.notifyDataChange(data);
                        this.lastSync = data.lastUpdate;
                    }
                } catch (error) {
                    console.log('Storage event error:', error);
                }
            }
        });
        
        // Poll for changes every second
        setInterval(async () => {
            const cloudData = await this.loadFromCloud();
            if (cloudData && cloudData.lastUpdate > this.lastSync && cloudData.savedBy !== this.getCurrentUser()) {
                this.notifyDataChange(cloudData);
                this.lastSync = cloudData.lastUpdate;
            }
        }, this.syncInterval);
    }
    
    getCurrentUser() {
        return localStorage.getItem('currentUser') || 'Unknown';
    }
    
    notifyDataChange(data) {
        window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: data }));
    }
    
    generateSyncVersion() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getConnectionStatus() {
        return {
            online: true,
            pendingChanges: 0,
            lastSync: this.lastSync
        };
    }
}

// Initialize cloud sync
window.cloudSync = new CloudSync();