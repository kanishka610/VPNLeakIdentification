const API_URL = 'https://a3412e272b54.ngrok-free.app';
let sessionId = null;

// Initialize session ID
async function initializeSession() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['vpnSessionId'], (result) => {
            if (result.vpnSessionId) {
                sessionId = result.vpnSessionId;
                console.log('🆔 Using existing session ID:', sessionId);
            } else {
                sessionId = 'user_' + Math.random().toString(36).substr(2, 9);
                chrome.storage.local.set({ vpnSessionId: sessionId }, () => {
                    console.log('🆔 Generated new session ID:', sessionId);
                });
            }
            
            chrome.action.setBadgeText({ text: 'ON' });
            chrome.action.setBadgeBackgroundColor({ color: '#007BFF' });
            resolve();
        });
    });
}

// Detect YouTube navigation
chrome.webNavigation.onCompleted.addListener((details) => {
    if (details.url && details.url.includes('youtube.com')) {
        console.log('🎬 YouTube detected:', details.url);
        reportYouTubeDetection(details.url);
    }
});

// Detect tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com')) {
        console.log('🎬 YouTube tab loaded:', tab.url);
        reportYouTubeDetection(tab.url);
    }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'YOUTUBE_DETECTED') {
        console.log('🎬 YouTube detected via content script');
        reportYouTubeDetection(request.url);
        sendResponse({ status: 'success', sessionId: sessionId });
    }
    
    if (request.type === 'GET_SESSION_ID') {
        sendResponse({ sessionId: sessionId });
    }
    
    return true;
});

// Report YouTube detection
async function reportYouTubeDetection(url) {
    if (!sessionId) {
        console.log('⏳ Waiting for session ID...');
        await initializeSession();
    }
    
    try {
        console.log('📡 Reporting YouTube detection for session:', sessionId);
        
        const response = await fetch(`${API_URL}/api/youtube-detected`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId,
                url: url,
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ YouTube detection reported successfully');
        
        updateExtensionBadge(data.vpn_status);
        
    } catch (error) {
        console.error('❌ Error reporting YouTube detection:', error);
    }
}

// Update extension badge
function updateExtensionBadge(vpnStatus) {
    if (!vpnStatus) return;
    
    try {
        if (vpnStatus.leak_detected) {
            chrome.action.setBadgeText({ text: '!' });
            chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
        } else if (vpnStatus.is_vpn_detected) {
            chrome.action.setBadgeText({ text: 'VPN' });
            chrome.action.setBadgeBackgroundColor({ color: '#FFA500' });
        } else {
            chrome.action.setBadgeText({ text: '✓' });
            chrome.action.setBadgeBackgroundColor({ color: '#00FF00' });
        }
    } catch (error) {
        console.log('⚠️ Could not update badge');
    }
}

// Handle extension icon click - FIXED: Always use the extension's session ID
chrome.action.onClicked.addListener((tab) => {
    console.log('🖱️ Extension icon clicked');
    
    if (!sessionId) {
        initializeSession().then(() => {
            // Store the session ID in localStorage for the dashboard
            const dashboardUrl = `${API_URL}/dashboard.html?session=${sessionId}`;
            console.log('🔗 Opening dashboard with session:', sessionId);
            chrome.tabs.create({ url: dashboardUrl });
        });
    } else {
        // Store the session ID in localStorage for the dashboard
        const dashboardUrl = `${API_URL}/dashboard.html?session=${sessionId}`;
        console.log('🔗 Opening dashboard with session:', sessionId);
        chrome.tabs.create({ url: dashboardUrl });
    }
});

// Extension installed
chrome.runtime.onInstalled.addListener(() => {
    console.log('🔧 Extension installed');
    initializeSession();
});

// Also initialize on startup
chrome.runtime.onStartup.addListener(() => {
    console.log('🔄 Extension starting up...');
    initializeSession();
});

console.log('✅ VPN Leak Detector Background Script Ready');