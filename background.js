// Background service worker for the Darija Translator extension
//listens for user actions and manages the side panel state
// Create context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item for translating selected text
  chrome.contextMenus.create({
    id: "translateToDarija",
    title: "Translate to Darija",
    contexts: ["selection"]
  });

  // Set side panel behavior - open on action click
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translateToDarija" && info.selectionText) {
    // Store the selected text
    chrome.storage.local.set({ selectedText: info.selectionText });

    // Open the side panel
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Listen for messages from content script or side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TEXT_SELECTED") {
    // Store selected text and open side panel
    chrome.storage.local.set({ selectedText: message.text });

    if (sender.tab) {
      chrome.sidePanel.open({ tabId: sender.tab.id });
    }
  }

  if (message.type === "GET_SELECTED_TEXT") {
    chrome.storage.local.get(["selectedText"], (result) => {
      sendResponse({ text: result.selectedText || "" });
    });
    return true; // Required for async sendResponse
  }

  if (message.type === "CLEAR_SELECTED_TEXT") {
    chrome.storage.local.remove("selectedText");
  }
});
