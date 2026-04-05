document.addEventListener('DOMContentLoaded', async function() {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const statusMessage = document.getElementById('statusMessage');

    let currentTab = null;

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    // Check if we're on Gmail
    const isGmailTab = tab?.url?.startsWith('https://mail.google.com/');

    if (!isGmailTab) {
        statusMessage.textContent = 'Open a Gmail page to use this extension';
        statusMessage.className = 'status error';
        toggleSwitch.style.opacity = '0.5';
        toggleSwitch.style.cursor = 'not-allowed';
        return;
    }

    // Get current toggle state from background
    chrome.runtime.sendMessage({ action: "getToggleState", tabId: tab.id }, function(response) {
        const isVisible = response?.isVisible || false;
        updateToggleUI(isVisible);
    });

    // Toggle switch click handler
    toggleSwitch.addEventListener('click', function() {
        if (!isGmailTab) return;

        const isCurrentlyActive = toggleSwitch.classList.contains('active');
        const newState = !isCurrentlyActive;

        updateToggleUI(newState);

        chrome.runtime.sendMessage({
            action: "toggleDisplay",
            tabId: currentTab.id,
            shouldShow: newState
        }, function(response) {
            if (response?.success) {
                updateToggleUI(newState);
            } else {
                statusMessage.textContent = response?.error || 'Error toggling display';
                statusMessage.className = 'status error';
            }
        });
    });

    function updateToggleUI(isActive) {
        if (isActive) {
            toggleSwitch.classList.add('active');
            statusMessage.textContent = 'Display is on';
            statusMessage.className = 'status on';
        } else {
            toggleSwitch.classList.remove('active');
            statusMessage.textContent = 'Display is off';
            statusMessage.className = 'status off';
        }
    }
});