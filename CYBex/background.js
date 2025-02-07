const GOOGLE_SAFE_BROWSING_API_KEY = 'YOUR_GOOGLE_SAFE_BROWSING_API_KEY';
const VIRUSTOTAL_API_KEY = 'YOUR_VIRUSTOTAL_API_KEY';

async function checkUrl(url) {
    const safeBrowsingResponse = await fetch('https://safebrowsing.googleapis.com/v4/threatMatches:find?key=' + GOOGLE_SAFE_BROWSING_API_KEY, {
        method: 'POST',
        body: JSON.stringify({
            client: {
                clientId: "yourcompanyname",
                clientVersion: "1.0"
            },
            threatInfo: {
                threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
                platformTypes: ["ANY_PLATFORM"],
                threatEntryTypes: ["URL"],
                threatEntries: [{ url }]
            }
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    const result = await safeBrowsingResponse.json();
    return result.matches ? true : false;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        checkUrl(tab.url).then(isMalicious => {
            if (isMalicious) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: () => { alert("This website is potentially harmful!"); }
                });
            }
        });
    }
});