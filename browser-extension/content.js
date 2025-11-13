// VPN Leak Detector Content Script
console.log('🔒 VPN Leak Detector loaded on YouTube');

// Function to report YouTube detection
function reportYouTubeDetection() {
    chrome.runtime.sendMessage({
        type: 'YOUTUBE_DETECTED',
        url: window.location.href,
        timestamp: new Date().toISOString(),
        title: document.title
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.log('⚠️ Background script not available:', chrome.runtime.lastError);
        } else if (response && response.status === 'success') {
            console.log('✅ YouTube detection reported successfully. Session:', response.sessionId);
        }
    });
}

// Report initial page load
reportYouTubeDetection();

// Monitor for URL changes (YouTube is a SPA)
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl && currentUrl.includes('youtube.com')) {
        console.log('🔄 YouTube page changed:', currentUrl);
        lastUrl = currentUrl;
        
        setTimeout(() => {
            reportYouTubeDetection();
        }, 1000);
    }
});

observer.observe(document, {
    subtree: true,
    childList: true
});

// Also listen for history changes
window.addEventListener('popstate', reportYouTubeDetection);
window.addEventListener('pushState', reportYouTubeDetection);
window.addEventListener('replaceState', reportYouTubeDetection);

console.log('✅ VPN Leak Detector Content Script Running');