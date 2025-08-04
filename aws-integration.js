// AWS DynamoDB Integration
class AWSIntegration {
    constructor() {
        // Replace with your API Gateway endpoint after deployment
        this.apiUrl = 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod';
    }

    async saveToCloud(dataType, data) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataType, data })
            });
            return await response.json();
        } catch (error) {
            console.error('Save to cloud failed:', error);
            throw error;
        }
    }

    async loadFromCloud(dataType) {
        try {
            const response = await fetch(`${this.apiUrl}/${dataType}`);
            return await response.json();
        } catch (error) {
            console.error('Load from cloud failed:', error);
            return null;
        }
    }
}

// Initialize AWS integration
const awsIntegration = new AWSIntegration();

// Make functions available globally
window.saveToCloud = (key, data) => awsIntegration.saveToCloud(key, data);
window.loadFromCloud = (key) => awsIntegration.loadFromCloud(key);