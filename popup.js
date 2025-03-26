// popup.js - Handles blocking, unblocking, and Gemini queries

const GEMINI_API_KEY = "AIzaSyDbuqQ1BwqRhZPpjjGldQBS4Tr6u0qpsME";  // Replace with your Gemini API key

document.addEventListener("DOMContentLoaded", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        const url = tabs[0].url;

        checkAndDisplayResult(url);
        checkIfBlocked(url);
    });
});

function checkAndDisplayResult(url) {
    chrome.runtime.sendMessage({ type: "CHECK_URL", url: url }, (response) => {
        const resultDiv = document.getElementById("result");
        resultDiv.innerHTML = "";

        if (response.isMalicious) {
            resultDiv.innerText = `⚠️ This website may be unsafe! Threats detected: ${response.threats.join(", ")}`;
            resultDiv.style.color = "red";
        } else {
            resultDiv.innerText = "✅ This website is safe!";
            resultDiv.style.color = "green";
        }
    });
}

// Check if the site is already blocked
function checkIfBlocked(url) {
    chrome.storage.local.get(["blockedSites"], (data) => {
        let blockedSites = data.blockedSites || [];

        if (blockedSites.includes(url)) {
            document.getElementById("block-site").style.display = "none";
            document.getElementById("unblock-site").style.display = "block";
        } else {
            document.getElementById("block-site").style.display = "block";
            document.getElementById("unblock-site").style.display = "none";
        }
    });
}

// Block the site when the button is clicked
document.getElementById("block-site").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        const url = tabs[0].url;

        chrome.runtime.sendMessage({ type: "BLOCK_THIS_SITE", url: url });
        checkIfBlocked(url);
        chrome.tabs.reload();
    });
});

// Unblock the site when the button is clicked
document.getElementById("unblock-site").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        const url = tabs[0].url;

        chrome.runtime.sendMessage({ type: "UNBLOCK_THIS_SITE", url: url });
        checkIfBlocked(url);
        chrome.tabs.reload();
    });
});

// Handle Gemini queries
document.getElementById("ask-gpt").addEventListener("click", async () => {
    const prompt = document.getElementById("gpt-prompt").value;
    if (prompt.trim() === "") return;

    const gptResponseDiv = document.getElementById("gpt-response");
    gptResponseDiv.innerText = "Generating response...";

    try {
        const response = await queryGemini(prompt);
        gptResponseDiv.innerText = response;
    } catch (error) {
        console.error("Error querying Gemini:", error);
        gptResponseDiv.innerText = "An error occurred while generating the response.";
    }
});

// Function to query the Gemini API
async function queryGemini(prompt) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: prompt,
                        },
                    ],
                },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Gemini API Response:", data);  // Log the full response for debugging

    // Check if the response contains the expected structure
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts) {
        return data.candidates[0].content.parts[0].text || "Sorry, I couldn't generate a response.";
    } else {
        throw new Error("Unexpected response structure from Gemini API.");
    }
}