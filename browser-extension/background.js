// OpenCitation Browser Extension - Background Service Worker

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Set default settings
    chrome.storage.local.set({
      citationStyle: "apa",
      apiBaseUrl: "http://localhost:3000",
    });

    console.log("OpenCitation extension installed");
  }
});

// Handle messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PAGE_INFO") {
    // Get info from content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "EXTRACT_PAGE_INFO" }, (response) => {
          sendResponse(response);
        });
      }
    });
    return true; // Async response
  }

  if (message.type === "OPEN_CITATION_PAGE") {
    // Open the citation page in a new tab
    const url = message.url;
    chrome.tabs.create({ url });
    sendResponse({ success: true });
  }
});

// Context menu for right-click citation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "cite-this-page",
    title: "Cite this page with OpenCitation",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "cite-this-page") {
    // Open popup or citation page
    const url = `http://localhost:3000/cite?url=${encodeURIComponent(tab.url)}`;
    chrome.tabs.create({ url });
  }
});
