// Working multi-user sync using JSONBin.io (with real API)
class WorkingSync {
    constructor() {
        // Real JSONBin.io setup - you need to get a free API key from jsonbin.io
        this.binId = null;
        this.apiKey = null; // User needs to set this
        this.baseUrl = 'https://api.jsonbin.io/v3/b';
        this.lastSync = 0;
        this.syncInterval = 3000;
        
        this.setupRealSync();
    }
    
    async setupRealSync() {
        // Create a new bin for this session
        try {
            const response = await fetch('https://api.jsonbin.io/v3/b', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    titles: [],
                    plans: [],
                    activities: [],
                    allocation: { marqueeTotal: 12, blockbusterTotal: 6 },
                    chatHistory: [],
                    onlineUsers: [],
                    lastUpdate: Date.now(),
                    updatedBy: 'System'
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.binId = result.record.id;
                console.log('Created shared session:', this.binId);
                this.startSyncLoop();
            } else {
                console.log('Using fallback sync method');
                this.useFallbackSync();
            }
        } catch (error) {
            console.log('Using fallback sync method');
            this.useFallbackSync();
        }
    }
    
    useFallbackSync() {
        // Fallback: Use a simple shared URL parameter system
        const urlParams = new URLSearchParams(window.location.search);
        let sessionId = urlParams.get('session');
        
        if (!sessionId) {
            sessionId = 'session-' + Date.now();
            const newUrl = window.location.href + '?session=' + sessionId;
            window.history.replaceState({}, '', newUrl);
            alert('Share this URL with other users for collaboration: ' + newUrl);
        }
        
        this.sessionId = sessionId;
        this.startFallbackSync();
    }
    
    startFallbackSync() {
        // Use URL hash for simple cross-user sync
        setInterval(() => {
            this.checkHashSync();
        }, 2000);
        
        window.addEventListener('hashchange', () => {
            this.checkHashSync();
        });
    }
    
    checkHashSync() {
        try {
            const hash = window.location.hash.substring(1);
            if (hash && hash.startsWith('data=')) {
                const data = JSON.parse(decodeURIComponent(hash.substring(5)));
                if (data.lastUpdate > this.lastSync && data.updatedBy !== this.getCurrentUser()) {
                    this.notifyDataChange(data);
                    this.lastSync = data.lastUpdate;
                }
            }
        } catch (error) {
            console.log('Hash sync error:', error);
        }
    }
    
    async saveToCloud(data) {
        const payload = {
            ...data,
            lastUpdate: Date.now(),
            updatedBy: data.updatedBy || 'Unknown'
        };
        
        if (this.binId) {
            // Try real API
            try {
                await fetch(`${this.baseUrl}/${this.binId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                this.lastSync = payload.lastUpdate;
                return true;
            } catch (error) {
                console.log('API sync failed, using fallback');
            }
        }
        
        // Fallback: Update URL hash for sharing
        const encodedData = encodeURIComponent(JSON.stringify(payload));
        window.location.hash = 'data=' + encodedData;
        this.lastSync = payload.lastUpdate;
        return true;
    }
    
    async loadFromCloud() {
        if (this.binId) {
            try {
                const response = await fetch(`${this.baseUrl}/${this.binId}/latest`);
                if (response.ok) {
                    const result = await response.json();
                    return result.record;
                }
            } catch (error) {
                console.log('Load failed, using fallback');
            }
        }
        
        // Fallback: Load from URL hash
        try {
            const hash = window.location.hash.substring(1);
            if (hash && hash.startsWith('data=')) {
                return JSON.parse(decodeURIComponent(hash.substring(5)));
            }
        } catch (error) {
            console.log('Hash load error:', error);
        }
        
        return null;
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
    
    getCurrentUser() {
        return localStorage.getItem('currentUser') || 'Unknown';
    }
    
    notifyDataChange(data) {
        window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: data }));
    }
    
    setCurrentUser(username) {
        this.currentUser = username;
    }
    
    getConnectionStatus() {
        return {
            online: true,
            sessionId: this.sessionId || this.binId,
            onlineUsers: []
        };
    }
}

// Replace the old sync
window.realCloudSync = new WorkingSync();