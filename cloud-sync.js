// Cloud Sync Module for Multi-User Collaboration
class CloudSync {
    constructor() {
        this.binId = '676a1b2c8e4aa6046a0b1234';
        this.apiKey = '$2a$10$9vKvO9QyP5l8W8mIFuZ9Q.5tY7gH3pL2nR4sT6uV8wX0yZ1aB2cD3e';
        this.baseUrl = 'https://api.jsonbin.io/v3/b';
        this.lastSync = 0;
        this.syncInterval = 3000; // 3 seconds
        this.isOnline = navigator.onLine;
        this.pendingChanges = [];
        
        this.setupOnlineDetection();
        this.startSyncLoop();
    }
    
    setupOnlineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncPendingChanges();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }
    
    async saveToCloud(data) {
        if (!this.isOnline) {
            this.pendingChanges.push(data);
            return false;
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/${this.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.apiKey,
                    'X-Bin-Versioning': 'false'
                },
                body: JSON.stringify({
                    ...data,
                    lastUpdate: Date.now(),
                    syncVersion: this.generateSyncVersion()
                })
            });
            
            if (response.ok) {
                this.lastSync = Date.now();
                return true;
            }
            
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            console.log('Cloud save failed:', error.message);
            this.pendingChanges.push(data);
            return false;
        }
    }
    
    async loadFromCloud() {
        if (!this.isOnline) return null;
        
        try {
            const response = await fetch(`${this.baseUrl}/${this.binId}/latest`, {
                headers: {
                    'X-Master-Key': this.apiKey
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.record;
            }
            
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            console.log('Cloud load failed:', error.message);
            return null;
        }
    }
    
    async syncPendingChanges() {
        while (this.pendingChanges.length > 0 && this.isOnline) {
            const data = this.pendingChanges.shift();
            await this.saveToCloud(data);
        }
    }
    
    startSyncLoop() {
        setInterval(async () => {
            if (this.isOnline) {
                const cloudData = await this.loadFromCloud();
                if (cloudData && cloudData.lastUpdate > this.lastSync) {
                    this.notifyDataChange(cloudData);
                    this.lastSync = cloudData.lastUpdate;
                }
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
            online: this.isOnline,
            pendingChanges: this.pendingChanges.length,
            lastSync: this.lastSync
        };
    }
}

// Initialize cloud sync
window.cloudSync = new CloudSync();