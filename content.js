// content.js - Shows warning popup and handles site blocking

const currentUrl = window.location.href;
chrome.runtime.sendMessage({ type: "CHECK_URL", url: currentUrl });

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "SHOW_POPUP") {
        showWarningPopup(message.threats);
    } else if (message.type === "BLOCK_SITE") {
        blockPage();
    } else if (message.type === "UNBLOCK_SITE") {
        location.reload(); // Refresh when unblocked
    }
});

// Function to display a serious warning popup
function showWarningPopup(threats) {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(0, 0, 0, 0.8)";
    overlay.style.color = "white";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "99999";
    overlay.style.fontSize = "18px";
    overlay.style.textAlign = "center";

    overlay.innerHTML = `
        <div style="background:#ff4d4d;padding:30px;border-radius:10px;box-shadow:0px 0px 15px rgba(255,0,0,0.8);width:400px;">
            <h2 style="margin:0;font-size:24px;">⚠️ SECURITY WARNING</h2>
            <p>This website may be unsafe.</p>
            <p><strong>Threats detected:</strong> ${threats.join(", ")}</p>
            <button id="close-warning" style="background:black;color:white;padding:10px;border:none;border-radius:5px;cursor:pointer;margin-top:10px;">
                Dismiss Warning
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("close-warning").addEventListener("click", () => {
        overlay.remove();
    });
}

// Function to block the entire page
function blockPage() {
    document.body.innerHTML = `
        <div style="
            display:flex;
            justify-content:center;
            align-items:center;
            height:100vh;
            background-color:#1a1a1a;
            color:white;
            text-align:center;
            font-family:Arial, sans-serif;
        ">
            <div style="max-width:500px;padding:30px;background:#ff4d4d;border-radius:10px;box-shadow:0px 0px 15px rgba(255,0,0,0.8);">
                <h1 style="margin-bottom:10px;">🚫 ACCESS DENIED</h1>
                <p style="font-size:18px;">This website has been blocked due to security risks.</p>
                <p>Accessing this site may compromise your security.</p>
                <button id="unblock-site" style="background:white;color:black;padding:12px;border:none;border-radius:5px;cursor:pointer;margin-top:15px;font-size:16px;">
                    ❌ Unblock Site
                </button>
            </div>
        </div>
    `;

    document.getElementById("unblock-site").addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "UNBLOCK_THIS_SITE", url: currentUrl });
    });
}
