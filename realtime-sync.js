// Real-time synchronization using Firebase
class RealtimeSync {
    constructor() {
        this.isConnected = false;
        this.activeUsers = new Set();
        this.lastSync = null;
        this.syncEnabled = true;
    }

    async initialize() {
        try {
            // Simulate Firebase connection
            this.isConnected = true;
            this.updateConnectionStatus();
            this.startHeartbeat();
            return true;
        } catch (error) {
            console.error('Failed to initialize real-time sync:', error);
            return false;
        }
    }

    updateConnectionStatus() {
        const statusEl = document.getElementById('connectionStatus');
        const activeUsersEl = document.getElementById('activeUsers');
        
        if (statusEl) {
            statusEl.className = `status-indicator ${this.isConnected ? 'online' : 'offline'}`;
        }
        
        if (activeUsersEl) {
            const userCount = this.activeUsers.size || 1;
            activeUsersEl.textContent = `${userCount} user${userCount !== 1 ? 's' : ''} online`;
        }
    }

    startHeartbeat() {
        // Simulate user presence
        setInterval(() => {
            if (this.isConnected) {
                this.activeUsers.add(window.app?.currentUser || 'Anonymous');
                this.updateConnectionStatus();
            }
        }, 30000);
    }

    async syncData(dataType, data) {
        if (!this.syncEnabled || !this.isConnected) return false;
        
        try {
            // Simulate real-time sync
            this.lastSync = new Date();
            this.broadcastChange(dataType, data);
            return true;
        } catch (error) {
            console.error('Sync failed:', error);
            return false;
        }
    }

    broadcastChange(dataType, data) {
        // Simulate broadcasting changes to other users
        const event = new CustomEvent('dataChanged', {
            detail: { dataType, data, user: window.app?.currentUser, timestamp: new Date() }
        });
        window.dispatchEvent(event);
    }

    onDataChange(callback) {
        window.addEventListener('dataChanged', (event) => {
            if (event.detail.user !== window.app?.currentUser) {
                callback(event.detail);
            }
        });
    }
}

// Initialize real-time sync
window.realtimeSync = new RealtimeSync();