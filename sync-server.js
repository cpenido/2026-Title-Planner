// Simple sync server using JSONBin.io (free service)
class SyncServer {
    constructor() {
        this.binId = '676a1234567890abcdef1234'; // Replace with actual bin ID
        this.apiKey = '$2a$10$your-api-key-here'; // Replace with actual API key
        this.baseUrl = 'https://api.jsonbin.io/v3/b';
    }

    async saveData(data) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.apiKey
                },
                body: JSON.stringify({
                    ...data,
                    lastUpdate: Date.now()
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Save failed:', error);
            return false;
        }
    }

    async loadData() {
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
        } catch (error) {
            console.error('Load failed:', error);
        }
        return null;
    }
}

window.syncServer = new SyncServer();