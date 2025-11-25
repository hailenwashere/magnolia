let tabId;

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'getMaterials') {
        console.log("Background script received getMaterials message from popup");
        // send message to content script to get highlighted materials
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            tabId = tabs[0].id;
            chrome.tabs.sendMessage(tabId, { action: 'scrapePageForMaterials' }, function(response) {
                sendResponse(response);
            });
        });
        return true;
    }
    // send message back to popup script with retrieved materials   
    if (message.action === 'returnScrapedMaterials') {
        sendResponse({ materials: message.materials });
    }
});



  
// // Listen for your specific event and open the popup
// chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
//     if (message.action === 'openPopup') {
//         chrome.action.openPopup();
//     }
// });