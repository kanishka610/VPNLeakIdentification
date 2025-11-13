class VPNLeakDetector {
    constructor() {
        this.baseUrl = 'https://a3412e272b54.ngrok-free.app';
        this.monitoring = false;
        this.sessionId = 'user_' + Math.random().toString(36).substr(2, 9);
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        document.getElementById('startMonitor').addEventListener('click', () => this.startMonitoring());
        document.getElementById('stopMonitor').addEventListener('click', () => this.stopMonitoring());
    }

    async startMonitoring() {
        try {
            const response = await fetch(`${this.baseUrl}/api/start-monitor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.sessionId
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.monitoring = true;
                this.updateUI();
                this.showNotification('Monitoring started successfully!', 'success');
            } else {
                this.showNotification(data.error || 'Failed to start monitoring', 'error');
            }
        } catch (error) {
            this.showNotification('Error connecting to server', 'error');
        }
    }

    async stopMonitoring() {
        this.monitoring = false;
        this.updateUI();
        this.showNotification('Monitoring stopped', 'info');
    }

    updateUI() {
        const statusElement = document.getElementById('monitoringStatus');
        const lastCheckElement = document.getElementById('lastCheck');
        
        if (this.monitoring) {
            statusElement.textContent = 'MONITORING';
            statusElement.className = 'status online';
            lastCheckElement.textContent = `Last check: ${new Date().toLocaleTimeString()}`;
        } else {
            statusElement.textContent = 'OFFLINE';
            statusElement.className = 'status offline';
        }
    }

    displayResults(data) {
        const resultsElement = document.getElementById('results');
        
        if (!data || data.error) {
            resultsElement.innerHTML = '<p class="no-results">Error retrieving results</p>';
            return;
        }

        const isLeak = data.leak_detected;
        const ipInfo = data.ip_info || {};
        
        resultsElement.innerHTML = `
            <div class="result-item ${isLeak ? 'leak' : 'safe'}">
                <div class="result-header">
                    <div class="result-title">VPN Status</div>
                    <div class="result-status ${isLeak ? 'status-leak' : 'status-safe'}">
                        ${isLeak ? 'LEAK DETECTED' : 'SECURE'}
                    </div>
                </div>
                <div class="result-details">
                    <strong>Public IP:</strong> ${data.public_ip || 'Unknown'}<br>
                    <strong>Location:</strong> ${ipInfo.city || 'Unknown'}, ${ipInfo.country || 'Unknown'}<br>
                    <strong>ISP/Organization:</strong> ${ipInfo.org || 'Unknown'}<br>
                    <strong>VPN Detected:</strong> ${data.is_vpn_detected ? 'Yes' : 'No'}<br>
                    ${isLeak ? '<strong style="color: #dc3545;">⚠️ Real IP may be exposed!</strong>' : ''}
                </div>
            </div>
        `;

        document.getElementById('lastCheck').textContent = `Last check: ${new Date().toLocaleTimeString()}`;

        if (isLeak) {
            this.showNotification('VPN LEAK DETECTED! Your real IP may be exposed.', 'warning');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : type === 'success' ? '#28a745' : '#007bff'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            max-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new VPNLeakDetector();
});