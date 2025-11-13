// Popup script
document.addEventListener('DOMContentLoaded', () => {
    const statusElement = document.getElementById('status');
    const openDashboardBtn = document.getElementById('openDashboard');
    const checkNowBtn = document.getElementById('checkNow');
    const viewDetectionsBtn = document.getElementById('viewDetections');
    
    // Check current status
    chrome.runtime.sendMessage({ type: 'CHECK_STATUS' }, (response) => {
        if (response) {
            if (response.isMonitoring) {
                statusElement.textContent = '🟢 Monitoring Active';
                statusElement.className = 'status safe';
            } else {
                statusElement.textContent = '🔴 Monitoring Offline';
                statusElement.className = 'status leak';
            }
        } else {
            statusElement.textContent = '⚪ Status Unknown';
            statusElement.className = 'status monitoring';
        }
    });
    
    // Open dashboard
    openDashboardBtn.addEventListener('click', () => {
        chrome.tabs.create({
            url: 'https://a3412e272b54.ngrok-free.app/dashboard.html'
        });
    });
    
    // Check VPN now
    checkNowBtn.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0] && tabs[0].url.includes('youtube.com')) {
                chrome.runtime.sendMessage({
                    type: 'YOUTUBE_DETECTED',
                    url: tabs[0].url
                });
                statusElement.textContent = '🔄 Checking...';
                statusElement.className = 'status monitoring';
            } else {
                statusElement.textContent = '⚠️ Open YouTube first';
                statusElement.className = 'status leak';
            }
        });
    });
    
    // View local detections
    viewDetectionsBtn.addEventListener('click', () => {
        chrome.tabs.create({
            url: chrome.runtime.getURL('detections.html')
        });
    });
});