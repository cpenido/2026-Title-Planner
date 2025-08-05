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
        // Check URL for session parameter first
        const urlParams = new URLSearchParams(window.location.search);
        let sessionId = urlParams.get('session');
        
        if (!sessionId) {
            sessionId = localStorage.getItem('title-planner-session');
        }
        
        if (!sessionId) {
            sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('title-planner-session', sessionId);
            
            // Update URL with session parameter
            const newUrl = `${window.location.origin}${window.location.pathname}?session=${sessionId}`;
            window.history.replaceState({}, '', newUrl);
            
            // Show copyable URL
            setTimeout(() => {
                const shareUrl = newUrl;
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert(`Session URL copied to clipboard!\n\nShare this URL: ${shareUrl}`);
                }).catch(() => {
                    alert(`Share this URL with other users:\n\n${shareUrl}`);
                });
            }, 1000);
        } else {
            localStorage.setItem('title-planner-session', sessionId);
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
    
    getSessionUrl() {
        return `${window.location.origin}${window.location.pathname}?session=${this.sessionId}`;
    }
    
    copySessionUrl() {
        const url = this.getSessionUrl();
        navigator.clipboard.writeText(url).then(() => {
            alert('Session URL copied to clipboard!');
        }).catch(() => {
            alert(`Copy this URL to share:\n\n${url}`);
        });
    }
}

// Initialize Firebase sync
window.realCloudSync = new FirebaseSync();

// Add copy button functionality
window.addEventListener('load', () => {
    const copyBtn = document.getElementById('copySessionUrl');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            window.realCloudSync.copySessionUrl();
        });
    }
});