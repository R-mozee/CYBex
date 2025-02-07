document.getElementById('check-url').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0].url;
        chrome.runtime.sendMessage({ url: url }, (response) => {
            document.getElementById('result').innerText = response.isMalicious ? "This website is potentially harmful!" : "This website is safe.";
        });
    });
});