// background.js

console.log("Background script loaded. Version 3.0.0 (WebLLM via offscreen document).");

let currentEmailData = {
    tabId: null,
    threadId: null,
    originalSubject: "",
    originalContent: "",
    rewrittenSubject: null,
    rewrittenContent: null,
    rewriteNeeded: false
};

// Map to store the visibility state of the in-page display for each tab
const inPageDisplayState = new Map(); // Key: tabId, Value: boolean (true if visible)

async function generateHash(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Offscreen document management ---

async function ensureOffscreenDocument() {
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT']
    });
    if (existingContexts.length > 0) return;

    await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['WORKERS'],
        justification: 'Run WebLLM inference for email rewriting via WebGPU'
    });
}

// --- LLM functions (via offscreen document) ---

async function callLlmForCheck(subject, content) {
    try {
        await ensureOffscreenDocument();
        const result = await chrome.runtime.sendMessage({
            target: "offscreen",
            action: "check",
            subject: subject,
            content: content
        });
        return result;
    } catch (error) {
        console.error("Error communicating with offscreen document for rewrite check:", error);
        return { rewrite_recommended: true, reason: `Check failed: ${error.message}` };
    }
}

async function callLlmForRewrite(subject, content, forceRewrite = false) {
    try {
        await ensureOffscreenDocument();
        const result = await chrome.runtime.sendMessage({
            target: "offscreen",
            action: "rewrite",
            subject: subject,
            content: content,
            forceRewrite: forceRewrite
        });
        return {
            rewritten_subject: result.rewritten_subject,
            rewritten_content: result.rewritten_content
        };
    } catch (error) {
        console.error("Error communicating with offscreen document for rewrite:", error);
        return { rewritten_subject: "[Rewrite Error]", rewritten_content: `Failed to rewrite: ${error.message}` };
    }
}

// --- Message handling (unchanged logic, uses new LLM functions) ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Ignore messages targeted at the offscreen document
    if (request.target === "offscreen") return;

    if (request.action === "displayEmailInPopup") {
        currentEmailData.threadId = request.threadId;
        currentEmailData.originalSubject = request.originalSubject;
        currentEmailData.originalContent = request.originalContent;
        currentEmailData.rewrittenSubject = null;
        currentEmailData.rewrittenContent = null;
        currentEmailData.rewriteNeeded = true;
        currentEmailData.tabId = sender.tab?.id || null;

        (async () => {
            const combinedOriginalContent = `${request.originalSubject}---${request.originalContent}`;
            const cacheKey = `rewritten_hash_${await generateHash(combinedOriginalContent)}`;
            const cached = await chrome.storage.local.get(cacheKey);

            let finalStatusMessage = "";
            let displayType = "info";

            if (cached[cacheKey] && cached[cacheKey].rewrittenSubject && cached[cacheKey].rewrittenContent) {
                if (sender.tab && sender.tab.id) {
                    chrome.tabs.sendMessage(sender.tab.id, { action: "cacheStatus", status: "FULL_REWRITE_HIT" });
                }
                currentEmailData.rewrittenSubject = cached[cacheKey].rewrittenSubject;
                currentEmailData.rewrittenContent = cached[cacheKey].rewrittenContent;
                currentEmailData.rewriteNeeded = false;
                finalStatusMessage = "Rewritten email loaded from cache.";
                displayType = "success";
            } else {
                let rewriteRecommended = false;
                let checkReason = "";

                try {
                    const checkResult = await callLlmForCheck(currentEmailData.originalSubject, currentEmailData.originalContent);
                    rewriteRecommended = checkResult.rewrite_recommended;
                    checkReason = checkResult.reason;
                    if (sender.tab && sender.tab.id) {
                         chrome.tabs.sendMessage(sender.tab.id, { action: "cacheStatus", status: `LLM_CHECK:${rewriteRecommended ? 'YES' : 'NO'}:${checkReason}` });
                    }
                } catch (error) {
                    console.error("Failed to get rewrite recommendation from LLM, assuming rewrite is needed:", error);
                    rewriteRecommended = true;
                    checkReason = `LLM check failed: ${error.message}`;
                }

                if (!rewriteRecommended) {
                    currentEmailData.rewrittenSubject = currentEmailData.originalSubject;
                    currentEmailData.rewrittenContent = currentEmailData.originalContent;
                    currentEmailData.rewriteNeeded = false;

                    await chrome.storage.local.set({ [cacheKey]: {
                        rewrittenSubject: currentEmailData.originalSubject,
                        rewrittenContent: currentEmailData.originalContent
                    }});
                    if (sender.tab && sender.tab.id) {
                         chrome.tabs.sendMessage(sender.tab.id, { action: "cacheStatus", status: "NO_REWRITE_CACHED" });
                    }
                    finalStatusMessage = `No rewrite needed: ${checkReason}`;
                    displayType = "info";
                } else {
                    if (sender.tab && sender.tab.id) {
                        chrome.tabs.sendMessage(sender.tab.id, { action: "cacheStatus", status: "MISS" });
                    }
                    finalStatusMessage = "Rewriting email...";
                    displayType = "warning";

                    const rewritten = await callLlmForRewrite(currentEmailData.originalSubject, currentEmailData.originalContent);
                    if (rewritten) {
                        currentEmailData.rewrittenSubject = rewritten.rewritten_subject;
                        currentEmailData.rewrittenContent = rewritten.rewritten_content;
                        currentEmailData.rewriteNeeded = false;
                        await chrome.storage.local.set({ [cacheKey]: {
                            rewrittenSubject: rewritten.rewritten_subject,
                            rewrittenContent: rewritten.rewritten_content
                        }});
                        if (sender.tab && sender.tab.id) {
                            chrome.tabs.sendMessage(sender.tab.id, { action: "cacheStatus", status: "WRITTEN" });
                        }
                        finalStatusMessage = "Email rewritten and cached.";
                        displayType = "success";
                    } else {
                        finalStatusMessage = "Error during rewrite. Check background console.";
                        displayType = "error";
                    }
                }
            }

            if (sender.tab && sender.tab.id) {
                chrome.tabs.sendMessage(sender.tab.id, {
                    action: "displayRewrittenContent",
                    rewrittenSubject: currentEmailData.rewrittenSubject,
                    rewrittenContent: currentEmailData.rewrittenContent,
                    statusMessage: finalStatusMessage,
                    type: displayType
                });
                inPageDisplayState.set(sender.tab.id, true);
            }
            chrome.runtime.sendMessage({ action: "updatePopupDisplay" }).catch(() => {});
        })();

        return true;
    }

    else if (request.action === "getDisplayData") {
        sendResponse(currentEmailData);
        return true;
    }

    else if (request.action === "forceRewrite") {
        currentEmailData.rewrittenSubject = null;
        currentEmailData.rewrittenContent = null;
        currentEmailData.rewriteNeeded = true;

        (async () => {
            const combinedOriginalContent = `${currentEmailData.originalSubject}---${currentEmailData.originalContent}`;
            const cacheKey = `rewritten_hash_${await generateHash(combinedOriginalContent)}`;
            await chrome.storage.local.remove(cacheKey);

            let finalStatusMessage = "";
            let displayType = "info";

            if (currentEmailData.tabId) {
                chrome.tabs.sendMessage(currentEmailData.tabId, { action: "cacheStatus", status: "FORCE_REWRITE" });
            }
            finalStatusMessage = "Force rewriting email...";
            displayType = "warning";

            const rewritten = await callLlmForRewrite(currentEmailData.originalSubject, currentEmailData.originalContent, true);
            if (rewritten) {
                currentEmailData.rewrittenSubject = rewritten.rewritten_subject;
                currentEmailData.rewrittenContent = rewritten.rewritten_content;
                currentEmailData.rewriteNeeded = false;
                await chrome.storage.local.set({ [cacheKey]: {
                    rewrittenSubject: rewritten.rewritten_subject,
                    rewrittenContent: rewritten.rewritten_content
                }});
                if (currentEmailData.tabId) {
                    chrome.tabs.sendMessage(currentEmailData.tabId, { action: "cacheStatus", status: "WRITTEN_AFTER_FORCE" });
                }
                finalStatusMessage = "Email force rewritten and cached.";
                displayType = "success";
            } else {
                finalStatusMessage = "Error during force rewrite. Check background console.";
                displayType = "error";
            }

            if (currentEmailData.tabId) {
                chrome.tabs.sendMessage(currentEmailData.tabId, {
                    action: "displayRewrittenContent",
                    rewrittenSubject: currentEmailData.rewrittenSubject,
                    rewrittenContent: currentEmailData.rewrittenContent,
                    statusMessage: finalStatusMessage,
                    type: displayType
                });
                inPageDisplayState.set(currentEmailData.tabId, true);
            }
            chrome.runtime.sendMessage({ action: "updatePopupDisplay" }).catch(() => {});
        })();
        return true;
    }

    else if (request.action === "emailDetected") {
        chrome.action.setBadgeText({ text: "ON" });
        chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
    }
    else if (request.action === "emailClosed") {
        chrome.action.setBadgeText({ text: "" });
        currentEmailData = {
            tabId: null,
            threadId: null,
            originalSubject: "",
            originalContent: "",
            rewrittenSubject: null,
            rewrittenContent: null,
            rewriteNeeded: false
        };
        if (sender.tab && sender.tab.id) {
            chrome.tabs.sendMessage(sender.tab.id, { action: "removeRewrittenContent" });
            inPageDisplayState.set(sender.tab.id, false);
        }
    }

    else if (request.action === "toggleDisplay") {
        const tabId = request.tabId;
        const shouldShow = request.shouldShow;

        if (!tabId) {
            sendResponse({ success: false, error: "No tab ID provided" });
            return true;
        }

        if (shouldShow) {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: () => {
                    const subjectElement = document.querySelector('h2.hP');
                    const bodyElements = document.querySelectorAll('div.a3s.aiL');
                    const bodyElement = bodyElements.length > 0 ? bodyElements[bodyElements.length - 1] : null;
                    if (subjectElement && bodyElement) {
                        chrome.runtime.sendMessage({
                            action: "displayEmailInPopup",
                            threadId: "toggle-trigger",
                            originalSubject: subjectElement.textContent.trim(),
                            originalContent: bodyElement.textContent.trim()
                        });
                    }
                }
            });
            sendResponse({ success: true });
        } else {
            chrome.tabs.sendMessage(tabId, { action: "removeRewrittenContent" });
            inPageDisplayState.set(tabId, false);
            sendResponse({ success: true });
        }
        return true;
    }

    else if (request.action === "getToggleState") {
        const tabId = request.tabId;
        const isVisible = inPageDisplayState.get(tabId) || false;
        sendResponse({ isVisible: isVisible });
        return true;
    }
});
