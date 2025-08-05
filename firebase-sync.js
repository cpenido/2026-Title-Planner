// Real-time sync using Firebase Realtime Database (free tier)
class FirebaseSync {
    constructor() {
        this.databaseURL = 'https://title-planner-default-rtdb.firebaseio.com/';
        this.sessionId = this.getOrCreateSession();
        this.lastSync = 0;
        this.currentUser = null;
        
        this.startRealSync();
    }
    
    getOrCreateSession() {
        let sessionId = localStorage.getItem('title-planner-session');
        if (!sessionId) {
            sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('title-planner-session', sessionId);
            
            // Show session ID for sharing
            setTimeout(() => {
                alert(`Share this Session ID with other users: ${sessionId}\n\nOr share this URL: ${window.location.origin}${window.location.pathname}?session=${sessionId}`);
            }, 1000);
        }
        return sessionId;
    }
    
    async saveToCloud(data) {
        try {
            const payload = {
                ...data,
                lastUpdate: Date.now(),
                updatedBy: data.updatedBy || this.currentUser || 'Unknown'
            };
            
            const response = await fetch(`${this.databaseURL}sessions/${this.sessionId}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                this.lastSync = payload.lastUpdate;
                return true;
            }
            
            throw new Error('Save failed');
        } catch (error) {
            console.log('Firebase save failed:', error);
            return false;
        }
    }
    
    async loadFromCloud() {
        try {
            const response = await fetch(`${this.databaseURL}sessions/${this.sessionId}.json`);
            if (response.ok) {
                const data = await response.json();
                return data;
            }
            return null;
        } catch (error) {
            console.log('Firebase load failed:', error);
            return null;
        }
    }
    
    startRealSync() {
        // Poll for changes every 2 seconds
        setInterval(async () => {
            const cloudData = await this.loadFromCloud();
            if (cloudData && cloudData.lastUpdate > this.lastSync && cloudData.updatedBy !== this.currentUser) {
                this.notifyDataChange(cloudData);
                this.lastSync = cloudData.lastUpdate;
            }
        }, 2000);
    }
    
    setCurrentUser(username) {
        this.currentUser = username;
    }
    
    notifyDataChange(data) {
        window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: data }));
    }
    
    getConnectionStatus() {
        return {
            online: true,
            sessionId: this.sessionId,
            onlineUsers: []
        };
    }
}

// Initialize Firebase sync
window.realCloudSync = new FirebaseSync();