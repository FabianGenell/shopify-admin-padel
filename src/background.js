try {
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        console.log('Received message (background):', message);

        if (message.type === 'api') {
            chrome.tabs.sendMessage(sender.tab.id, message, function (response) {
                sendResponse(response);
            });
            return true; // indicates that the response will be sent asynchronously
        }

        if (message.type === 'redirect') {
            chrome.tabs.update(sender.tab.id, { url: message.url });
            return;
        }

        if (message.type === 'download') {
            console.log('Download message recieved');
            if (message.url) {
                chrome.downloads.download({ url: message.url, filename: message.filename });
            }
        }

        chrome.tabs.sendMessage(sender.tab.id, message);
    });

    chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
        const url = new URL(details.url);
        if (url.host === 'admin.shopify.com') {
            tabId = details.tabId;
            chrome.tabs.sendMessage(tabId, { type: 'webNavigation', details });
        }
    });
} catch (error) {
    console.error(error);
}
