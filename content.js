// Content script for detecting text selection
// This script listens for text selection events on web pages and stores the selected text in chrome.storage.local
// Safe storage function
function saveSelectedText(text) {
  try {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ selectedText: text });
    }
  } catch (e) {
    // Ignore errors on restricted pages
  }
}

// Listen for mouseup events to detect text selection
document.addEventListener("mouseup", () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText && selectedText.length > 0) {
    saveSelectedText(selectedText);
  }
});

// Listen for keyboard selection (Shift + arrow keys, Ctrl+A, etc.)
document.addEventListener("keyup", (e) => {
  if (e.shiftKey || e.ctrlKey || e.metaKey) {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText && selectedText.length > 0) {
      saveSelectedText(selectedText);
    }
  }
});
