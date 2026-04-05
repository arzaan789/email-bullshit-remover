// content.js

console.log("Gmail Email Rewriter: Content script loaded. Version 2.1.9 (Processing Message and Cleanup).");


let isProcessingOpenedEmail = false; // To prevent redundant concurrent processing
let lastProcessedThreadId = null; // To track if the currently opened email has been been processed

let bannerCollapsed = false;
let bannerRemovalCount = 0;
let useSidePanelFallback = false;
let userDismissedBanner = false;
let bannerSurvivalObserver = null;

const BANNER_ID = 'email-rewriter-inline-banner';
const SIDE_PANEL_ID = 'email-rewriter-side-panel';
const MAX_BANNER_REMOVALS = 3;

function injectBannerStyles() {
    if (document.getElementById('email-rewriter-styles')) return;
    const style = document.createElement('style');
    style.id = 'email-rewriter-styles';
    style.textContent = `
        @keyframes email-rewriter-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        #${BANNER_ID} *, #${SIDE_PANEL_ID} * {
            box-sizing: border-box;
        }
    `;
    document.head.appendChild(style);
}

function createInlineBanner() {
    const existing = document.getElementById(BANNER_ID);
    if (existing) return existing;

    const subjectElement = document.querySelector('h2.hP');
    if (!subjectElement) return null;

    // Find the parent container to inject into
    const subjectContainer = subjectElement.closest('.nH') || subjectElement.parentElement;
    if (!subjectContainer) return null;

    injectBannerStyles();

    const banner = document.createElement('div');
    banner.id = BANNER_ID;
    Object.assign(banner.style, {
        margin: '8px 16px',
        background: '#f0f4ff',
        borderLeft: '3px solid #667eea',
        borderRadius: '0 6px 6px 0',
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden',
        transition: 'opacity 0.3s ease-in-out',
        opacity: '0',
    });

    // Structural HTML — no user data interpolated
    banner.innerHTML = `
        <div data-role="peek" style="padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; min-width: 0;">
                <span style="font-size: 11px; font-weight: 600; color: #667eea; white-space: nowrap;">REWRITTEN</span>
                <span data-role="peek-subject" style="font-size: 13px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></span>
            </div>
            <span data-role="peek-toggle" style="color: #667eea; font-size: 12px; white-space: nowrap; margin-left: 8px; cursor: pointer;"></span>
        </div>
        <div data-role="expanded" style="display: none;">
            <div style="padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #dde3f8; cursor: pointer;">
                <span style="font-size: 11px; font-weight: 600; color: #667eea;">REWRITTEN VERSION</span>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span data-role="collapse-btn" style="color: #667eea; font-size: 12px; cursor: pointer;">▼ collapse</span>
                    <span data-role="close-btn" style="color: #999; font-size: 16px; cursor: pointer; line-height: 1;">×</span>
                </div>
            </div>
            <div style="padding: 12px;">
                <div style="font-size: 12px; color: #555; margin-bottom: 4px; font-weight: 500;">Subject:</div>
                <div data-role="subject" style="font-size: 13px; color: #202124; margin-bottom: 10px;"></div>
                <div style="font-size: 12px; color: #555; margin-bottom: 4px; font-weight: 500;">Content:</div>
                <div data-role="content" style="font-size: 13px; color: #202124; line-height: 1.5; background: #fff; padding: 8px; border-radius: 4px; border: 1px solid #e0e4f0; white-space: pre-wrap; word-wrap: break-word; max-height: 200px; overflow-y: auto;"></div>
            </div>
            <div style="padding: 0 12px 12px; display: flex; align-items: center; gap: 10px;">
                <button data-role="force-btn" style="background: #667eea; color: white; border: none; padding: 6px 14px; border-radius: 4px; font-size: 12px; cursor: pointer;">Force Rewrite</button>
                <span data-role="status" style="font-size: 11px; color: #888; font-style: italic;"></span>
            </div>
        </div>
    `;

    // Event: toggle collapse/expand
    banner.querySelector('[data-role="peek"]').addEventListener('click', () => {
        if (bannerCollapsed) toggleBannerCollapse(banner);
    });
    banner.querySelector('[data-role="collapse-btn"]').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBannerCollapse(banner);
    });

    // Event: close
    banner.querySelector('[data-role="close-btn"]').addEventListener('click', (e) => {
        e.stopPropagation();
        userDismissedBanner = true;
        removeBanner();
    });

    // Event: force rewrite
    const forceBtn = banner.querySelector('[data-role="force-btn"]');
    forceBtn.addEventListener('click', () => {
        forceBtn.disabled = true;
        forceBtn.style.backgroundColor = '#ccc';
        forceBtn.style.cursor = 'not-allowed';
        banner.querySelector('[data-role="status"]').textContent = 'Forcing rewrite...';
        chrome.runtime.sendMessage({ action: "forceRewrite" });
    });

    // Inject after the subject element's container
    subjectContainer.insertAdjacentElement('afterend', banner);

    // Fade in
    requestAnimationFrame(() => { banner.style.opacity = '1'; });

    return banner;
}

function showBannerProcessingState() {
    if (userDismissedBanner || useSidePanelFallback) return;

    const banner = createInlineBanner();
    if (!banner) return;

    // Show peek with processing state
    const peekSubject = banner.querySelector('[data-role="peek-subject"]');
    peekSubject.textContent = 'Checking email...';
    peekSubject.style.animation = 'email-rewriter-pulse 1.5s ease-in-out infinite';

    const peekToggle = banner.querySelector('[data-role="peek-toggle"]');
    peekToggle.textContent = '';

    // Hide expanded section during processing
    banner.querySelector('[data-role="expanded"]').style.display = 'none';
    banner.querySelector('[data-role="peek"]').style.display = 'flex';

    startBannerSurvivalObserver(banner);
}

function updateBannerContent(subject, content, statusMessage) {
    let banner = document.getElementById(BANNER_ID);
    if (!banner) {
        if (userDismissedBanner) return;
        banner = createInlineBanner();
    }
    if (!banner) return;

    // Stop processing animation
    const peekSubject = banner.querySelector('[data-role="peek-subject"]');
    peekSubject.style.animation = '';
    peekSubject.textContent = subject || '[No Subject]';

    // Set expanded content via textContent (XSS-safe)
    banner.querySelector('[data-role="subject"]').textContent = subject || '[No Subject]';
    banner.querySelector('[data-role="content"]').textContent = content || '[No Content]';
    banner.querySelector('[data-role="status"]').textContent = statusMessage || '';

    // Re-enable force rewrite button
    const forceBtn = banner.querySelector('[data-role="force-btn"]');
    forceBtn.disabled = false;
    forceBtn.style.backgroundColor = '#667eea';
    forceBtn.style.cursor = 'pointer';

    // Apply collapse state
    if (bannerCollapsed) {
        banner.querySelector('[data-role="peek"]').style.display = 'flex';
        banner.querySelector('[data-role="expanded"]').style.display = 'none';
        banner.querySelector('[data-role="peek-toggle"]').textContent = '▶ expand';
    } else {
        banner.querySelector('[data-role="peek"]').style.display = 'none';
        banner.querySelector('[data-role="expanded"]').style.display = 'block';
    }

    startBannerSurvivalObserver(banner);
}

function toggleBannerCollapse(banner) {
    if (!banner) banner = document.getElementById(BANNER_ID);
    if (!banner) return;

    bannerCollapsed = !bannerCollapsed;

    if (bannerCollapsed) {
        banner.querySelector('[data-role="peek"]').style.display = 'flex';
        banner.querySelector('[data-role="expanded"]').style.display = 'none';
        banner.querySelector('[data-role="peek-toggle"]').textContent = '▶ expand';
    } else {
        banner.querySelector('[data-role="peek"]').style.display = 'none';
        banner.querySelector('[data-role="expanded"]').style.display = 'block';
    }
}

function removeBanner() {
    stopBannerSurvivalObserver();
    const banner = document.getElementById(BANNER_ID);
    if (banner) {
        banner.style.opacity = '0';
        setTimeout(() => banner.remove(), 300);
    }
    const sidePanel = document.getElementById(SIDE_PANEL_ID);
    if (sidePanel) {
        sidePanel.style.opacity = '0';
        setTimeout(() => sidePanel.remove(), 300);
    }
}

function createSidePanel() {
    const existing = document.getElementById(SIDE_PANEL_ID);
    if (existing) return existing;

    injectBannerStyles();

    const panel = document.createElement('div');
    panel.id = SIDE_PANEL_ID;
    Object.assign(panel.style, {
        position: 'fixed',
        right: '0',
        top: '0',
        height: '100vh',
        width: '280px',
        background: '#f8f9ff',
        borderLeft: '2px solid #667eea',
        boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
        zIndex: '10000',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        opacity: '0',
        transition: 'opacity 0.3s ease-in-out',
    });

    panel.innerHTML = `
        <div style="padding: 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #dde3f8;">
            <span style="font-size: 11px; font-weight: 600; color: #667eea;">REWRITTEN</span>
            <span data-role="close-btn" style="font-size: 16px; color: #999; cursor: pointer; line-height: 1;">×</span>
        </div>
        <div style="flex: 1; overflow-y: auto; padding: 12px;">
            <div style="font-size: 11px; color: #555; margin-bottom: 3px; font-weight: 500;">Subject:</div>
            <div data-role="subject" style="font-size: 12px; color: #202124; margin-bottom: 12px;"></div>
            <div style="font-size: 11px; color: #555; margin-bottom: 3px; font-weight: 500;">Content:</div>
            <div data-role="content" style="font-size: 12px; color: #202124; line-height: 1.4; background: #fff; padding: 8px; border-radius: 4px; border: 1px solid #e0e4f0; white-space: pre-wrap; word-wrap: break-word;"></div>
        </div>
        <div style="padding: 12px; border-top: 1px solid #dde3f8; display: flex; align-items: center; gap: 8px;">
            <button data-role="force-btn" style="background: #667eea; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer; flex-shrink: 0;">Force Rewrite</button>
            <span data-role="status" style="font-size: 10px; color: #888; font-style: italic;"></span>
        </div>
    `;

    // Event: close
    panel.querySelector('[data-role="close-btn"]').addEventListener('click', () => {
        userDismissedBanner = true;
        removeBanner();
    });

    // Event: force rewrite
    const forceBtn = panel.querySelector('[data-role="force-btn"]');
    forceBtn.addEventListener('click', () => {
        forceBtn.disabled = true;
        forceBtn.style.backgroundColor = '#ccc';
        forceBtn.style.cursor = 'not-allowed';
        panel.querySelector('[data-role="status"]').textContent = 'Forcing rewrite...';
        chrome.runtime.sendMessage({ action: "forceRewrite" });
    });

    document.body.appendChild(panel);
    requestAnimationFrame(() => { panel.style.opacity = '1'; });

    return panel;
}

function updateSidePanelContent(subject, content, statusMessage) {
    let panel = document.getElementById(SIDE_PANEL_ID);
    if (!panel) {
        if (userDismissedBanner) return;
        panel = createSidePanel();
    }
    if (!panel) return;

    panel.querySelector('[data-role="subject"]').textContent = subject || '[No Subject]';
    panel.querySelector('[data-role="content"]').textContent = content || '[No Content]';
    panel.querySelector('[data-role="status"]').textContent = statusMessage || '';

    const forceBtn = panel.querySelector('[data-role="force-btn"]');
    forceBtn.disabled = false;
    forceBtn.style.backgroundColor = '#667eea';
    forceBtn.style.cursor = 'pointer';
}

function startBannerSurvivalObserver(banner) {
    stopBannerSurvivalObserver();
    if (!banner || !banner.parentNode) return;

    bannerSurvivalObserver = new MutationObserver((mutations) => {
        // Check if our banner was removed from the DOM
        if (!document.getElementById(BANNER_ID)) {
            // Banner was removed — but was it us or Gmail?
            if (userDismissedBanner) return;

            bannerRemovalCount++;
            console.warn(`Gmail Email Rewriter: Banner removed by page (${bannerRemovalCount}/${MAX_BANNER_REMOVALS})`);

            if (bannerRemovalCount >= MAX_BANNER_REMOVALS) {
                // Switch to side panel fallback
                console.warn('Gmail Email Rewriter: Switching to side panel fallback');
                useSidePanelFallback = true;
                stopBannerSurvivalObserver();
                // The next displayRewrittenContent message from background will use the side panel
            } else {
                // Try re-injecting the banner
                stopBannerSurvivalObserver();
                const newBanner = createInlineBanner();
                if (newBanner) {
                    startBannerSurvivalObserver(newBanner);
                }
            }
        }
    });

    bannerSurvivalObserver.observe(banner.parentNode, { childList: true });
}

function stopBannerSurvivalObserver() {
    if (bannerSurvivalObserver) {
        bannerSurvivalObserver.disconnect();
        bannerSurvivalObserver = null;
    }
}

function displayRewrittenContentInPage(subject, content, statusMessage, type) {
    if (userDismissedBanner) return;

    if (useSidePanelFallback) {
        updateSidePanelContent(subject, content, statusMessage);
    } else {
        updateBannerContent(subject, content, statusMessage);
    }
}

function removeRewrittenContentInPage() {
    userDismissedBanner = false;
    bannerRemovalCount = 0;
    useSidePanelFallback = false;
    removeBanner();
}

// Helper to get a unique ID for an email thread
async function getEmailThreadId(element, context = "unknown") {
    if (!element) return null;

    let threadId = null;

    if (context === "opened") {
        // --- Logic specifically for opened emails ---

        // Priority 1: Check the element itself, then closest ancestor for data-thread-perm-id or data-legacy-thread-id
        let threadIdSourceElement = element.closest('[data-thread-perm-id], [data-legacy-thread-id]');
        if (threadIdSourceElement) {
            threadId = threadIdSourceElement.dataset.threadPermId || threadIdSourceElement.dataset.legacyThreadId;
            if (threadId) {
                // Ensure it has the expected '#' prefix and consistent format
                if (!threadId.startsWith('#')) {
                    if (threadId.startsWith('thread-')) {
                        threadId = `#${threadId}`;
                    } else {
                        threadId = `#thread-f:${threadId}`; // Default to 'thread-f:' for raw IDs
                    }
                }
                return threadId;
            }
        }
        
        // Fallback: search broader in the document for conversation container
        const conversationContainer = document.querySelector('[data-thread-id], [data-legacy-thread-id]');
        if (conversationContainer) {
            threadId = conversationContainer.dataset.threadId || conversationContainer.dataset.legacyThreadId;
            if (threadId) {
                // Ensure it has the expected '#' prefix and consistent format
                if (!threadId.startsWith('#')) {
                    if (threadId.startsWith('thread-')) {
                        threadId = `#${threadId}`;
                    }
                    else {
                        threadId = `#thread-f:${threadId}`; // Default to 'thread-f:' for raw IDs
                    }
                }
                return threadId; // Moved return here
            }
        }

        // Priority 2: Fallback to searching jslog attributes on relevant elements
        let searchElement = element.closest('div.bAp.zA') || document.body;
        const jslogElements = searchElement.querySelectorAll('[jslog*="thread-f:"], [jslog*="thread-a:r"]');
        for (const el of jslogElements) {
            const dataJslog = el.getAttribute("jslog");
            if (dataJslog) {
                const match = dataJslog.match(/; 1:\[&quot;(#thread-f:\d+|#thread-a:r[\d-]+)&quot;/);
                if (match && match[1]) {
                    threadId = match[1];
                    return threadId;
                }
            }
        }

        // Priority 3: Fallback to URL parameters
        const urlParams = new URLSearchParams(window.location.hash.substring(1));
        const tid = urlParams.get("th");
        if (tid) {
            threadId = `#thread-f:${tid}`;
            return threadId;
        }

        // Priority 4: If all else fails, attempt a composite ID
        const subjectText = document.querySelector('h2.hP')?.textContent.trim();
        const senderEmail = document.querySelector('.gD[email]')?.getAttribute('email') || document.querySelector('.g3 span[email]')?.getAttribute('email');
        let dateTimeCanonical = null;

        let attempts = 0;
        const maxAttempts = 5;
        const retryDelayMs = 100;
        while (!dateTimeCanonical && attempts < maxAttempts) {
            const dateTimeElement = document.querySelector('.g3 span[title], .g3 div[aria-label]');
            if (dateTimeElement) {
                dateTimeCanonical = dateTimeElement.getAttribute('title') || dateTimeElement.getAttribute('aria-label');
            }
            if (!dateTimeCanonical) {
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
            }
            attempts++;
        }

        if (senderEmail && subjectText && dateTimeCanonical) {
            const composite = `${senderEmail}-${subjectText}-${dateTimeCanonical}`;
            threadId = `composite-${btoa(encodeURIComponent(composite))}`;
            return threadId;
        }

        console.warn("getEmailThreadId: (Opened) Failed to determine a reliable threadId. Element:", element); // Added log
        return null;
    }

    return threadId;
}

// --- Logic for Opened Email View ---
async function rewriteOpenedEmail() {
    if (isProcessingOpenedEmail) {
        return;
    }
    isProcessingOpenedEmail = true;
    userDismissedBanner = false;

    try {
        const subjectElement = document.querySelector('h2.hP');
        const bodyElement = document.querySelector('div.a3s.aiL');

        if (!subjectElement || !bodyElement) {
            console.warn("Gmail Email Rewriter (content.js): Subject or body element not found in opened email. Exiting rewriteOpenedEmail."); // Added log
            return;
        }

        const threadIdPromise = getEmailThreadId(subjectElement, "opened");
        const threadId = String(await threadIdPromise);
        if (!threadId) {
            console.warn("Gmail Email Rewriter (content.js): Could not get a stable thread ID for opened email. Aborting."); // Added log
            return;
        }
        
        const originalSubject = subjectElement.textContent.trim();
        const originalContent = bodyElement.textContent.trim();

        // Show inline processing state
        if (useSidePanelFallback) {
            updateSidePanelContent('Checking email...', '', 'Processing...');
        } else {
            showBannerProcessingState();
        }

        try {
            chrome.runtime.sendMessage({
                action: "displayEmailInPopup",
                threadId: threadId,
                originalSubject: originalSubject,
                originalContent: originalContent
            });
            chrome.runtime.sendMessage({
                action: "emailDetected"
            });
            lastProcessedThreadId = threadId; // Update lastProcessedThreadId here
        } catch (error) {
            if (error.message === "Extension context invalidated.") {
                console.warn("Gmail Email Rewriter (content.js): Extension context invalidated during sendMessage (displayEmailInPopup/emailDetected). Ignoring.");
            } else {
                console.error("Gmail Email Rewriter (content.js): Error sending message to background script:", error);
            }
        }
    } finally {
        isProcessingOpenedEmail = false;
        // The processing message will either be overwritten by the main display or timed out
        // Cleanup on successful display is handled by displayRewrittenContentInPage
    }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "cacheStatus") {
        // This is primarily for console logs now, in-page notifications handle UI
    } else if (request.action === "displayRewrittenContent") {
        displayRewrittenContentInPage(request.rewrittenSubject, request.rewrittenContent, request.statusMessage, request.type);
    } else if (request.action === "removeRewrittenContent") {
        removeRewrittenContentInPage();
    }
});

// --- Initialize and observe DOM changes ---
function initializeContentScript() {
    console.log("Gmail Email Rewriter: Initializing content script."); // Re-added log for clarity
    
    // Initial check for opened emails and set badge if found
    (async () => {
        try {
            const subjectElement = document.querySelector('h2.hP');
            const bodyElement = document.querySelector('div.a3s.aiL');
            if (subjectElement && bodyElement) {
                // The rewriteOpenedEmail function will handle setting lastProcessedThreadId and the internal processing lock
                await rewriteOpenedEmail();
            } else {
                if (lastProcessedThreadId !== null) { // Only send emailClosed if we had an email open
                    lastProcessedThreadId = null;
                    chrome.runtime.sendMessage({ action: "emailClosed" });
                }
            }
        } catch (error) {
            if (error.message === "Extension context invalidated.") {
                console.warn("Gmail Email Rewriter (content.js): Extension context invalidated during initial check. Ignoring.");
            }
            else {
                console.error("Gmail Email Rewriter (content.js): Error during initial check:", error);
            }
        }
    })();

    let mutationDebounceTimer = null;
    const observer = new MutationObserver((mutations) => {
        clearTimeout(mutationDebounceTimer);
        mutationDebounceTimer = setTimeout(async () => {
        let openedEmailViewDetected = false;
        const subjectElement = document.querySelector('h2.hP');
        const bodyElement = document.querySelector('div.a3s.aiL');

        if (subjectElement && bodyElement) {
            openedEmailViewDetected = true;
        }

        try {
            if (openedEmailViewDetected) {
                const currentThreadId = await getEmailThreadId(subjectElement, "opened"); // Get current thread ID
                if (currentThreadId && currentThreadId !== lastProcessedThreadId) { // Only process if new threadId
                    removeRewrittenContentInPage(); // Clear previous display on new email load
                    await rewriteOpenedEmail();
                } else {
                }
            } else {
                removeRewrittenContentInPage(); // Clear display when no email is open
                if (lastProcessedThreadId !== null) { // Only send emailClosed if we had an email open
                    lastProcessedThreadId = null;
                    chrome.runtime.sendMessage({ action: "emailClosed" });
                } else {
                }
            }
        } catch (error) {
            if (error.message === "Extension context invalidated.") {
                console.warn("Gmail Email Rewriter (content.js): Extension context invalidated during MutationObserver callback. Ignoring.");
            } else {
                console.error("Gmail Email Rewriter (content.js): Error during MutationObserver callback:", error);
            }
        }
        }, 300);
    });

    observer.observe(document.body, { childList: true, subtree: true });
}
// Run the initialization once the document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
    initializeContentScript();
}