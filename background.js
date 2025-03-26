// background.js - Handles URL checking in the background

const IPQS_API_KEY = "HSGsHjoLODNDj1gkgPANnRtPnJuuSLiD";  // Store securely!
const GOOGLE_SAFE_BROWSING_API_KEY = "AIzaSyCoXC8Musu83VulhmP3vua-C6-I0zzWalk";  // Store securely!
async function checkUrl(url) {
    const googleResult = await checkWithGoogleSafeBrowsing(url);
    if (googleResult.isMalicious) return googleResult;
    
    const ipqsResult = await checkWithIPQualityScore(url);
    return ipqsResult.isMalicious ? ipqsResult : { isMalicious: false, threats: [] };
}

async function checkWithIPQualityScore(url) {
    try {
        const apiUrl = `https://www.ipqualityscore.com/api/json/url/${IPQS_API_KEY}/${encodeURIComponent(url)}?strictness=1&fast=false`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.success && data.unsafe) {
            return { isMalicious: true, threats: ["PHISHING", "MALWARE", "SUSPICIOUS"].filter(t => data[t.toLowerCase()]) };
        }
    } catch (error) {
        console.error("Error checking IPQualityScore:", error);
    }
    return { isMalicious: false, threats: [] };
}

async function checkWithGoogleSafeBrowsing(url) {
    const requestBody = {
        client: { clientId: "cybex", clientVersion: "1.0" },
        threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }]
        }
    };

    try {
        const response = await fetch(
            `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_SAFE_BROWSING_API_KEY}`,
            {
                method: "POST",
                body: JSON.stringify(requestBody),
                headers: { "Content-Type": "application/json" }
            }
        );

        const data = await response.json();
        if (data.matches) {
            return { isMalicious: true, threats: data.matches.map(match => match.threatType) };
        }
    } catch (error) {
        console.error("Error checking Google Safe Browsing:", error);
    }

    return { isMalicious: false, threats: [] };
}

// background.js - Handles URL checking and site blocking

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CHECK_URL") {
        checkUrl(message.url).then(result => {
            sendResponse(result);

            if (sender && sender.tab && sender.tab.id) {
                if (result.isMalicious) {
                    chrome.tabs.sendMessage(sender.tab.id, { type: "SHOW_POPUP", threats: result.threats });
                }

                chrome.storage.local.get(["blockedSites"], (data) => {
                    let blockedSites = data.blockedSites || [];
                    if (blockedSites.includes(message.url)) {
                        chrome.tabs.sendMessage(sender.tab.id, { type: "BLOCK_SITE" });
                    }
                });
            }
        });
        return true;
    }

    if (message.type === "BLOCK_THIS_SITE") {
        chrome.storage.local.get(["blockedSites"], (data) => {
            let blockedSites = data.blockedSites || [];
            if (!blockedSites.includes(message.url)) {
                blockedSites.push(message.url);
                chrome.storage.local.set({ blockedSites });

                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs.length > 0) {
                        chrome.tabs.update(tabs[0].id, { url: "chrome://newtab" });
                    }
                });
            }
        });
    }

    if (message.type === "UNBLOCK_THIS_SITE") {
        chrome.storage.local.get(["blockedSites"], (data) => {
            let blockedSites = (data.blockedSites || []).filter(site => site !== message.url);
            chrome.storage.local.set({ blockedSites });

            if (sender && sender.tab && sender.tab.id) {
                chrome.tabs.sendMessage(sender.tab.id, { type: "UNBLOCK_SITE" });
            }
        });
    }
});