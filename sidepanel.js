// This script manages the side panel UI, handles user interactions, and communicates with
//  the background script to retrieve selected text
//   and API configurations. It also implements the translation logic using the configured API.
// DOM Elements
const sourceText = document.getElementById("sourceText");
const translatedText = document.getElementById("translatedText");
const translateBtn = document.getElementById("translateBtn");
const copyBtn = document.getElementById("copyBtn");
const charCount = document.getElementById("charCount");
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");
const apiKeySection = document.getElementById("apiKeySection");
const configureApiBtn = document.getElementById("configureApiBtn");

// Translation prompt
const TRANSLATION_PROMPT = `Detect the language of the following text and translate it to Moroccan Arabic Dialect (Darija). Use Arabic script. Provide ONLY the translation, no explanations:`;

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  await checkApiKey();//on attend leur résultat avant de continuer
  await loadSelectedText();

  chrome.storage.onChanged.addListener(async (changes, namespace) => {//namespace 
    if (namespace === "local" && changes.selectedText) {
      sourceText.value = changes.selectedText.newValue || "";
      updateCharCount();
    }
    if (namespace === "sync") {
      await checkApiKey();
    }
  });
});

// Check if API is configured
async function checkApiKey() {
  const result = await chrome.storage.sync.get(["apiUrl", "apiKey", "modelName"]);
  const isConfigured = result.apiUrl && result.apiKey && result.modelName;

  if (isConfigured) {
    apiKeySection.classList.add("configured");
    apiKeySection.querySelector(".api-key-warning span:last-child").textContent = "Ready";
    apiKeySection.querySelector(".warning-icon").textContent = "✅";
    configureApiBtn.textContent = "Settings";
  } else {
    apiKeySection.classList.remove("configured");
    apiKeySection.querySelector(".api-key-warning span:last-child").textContent = "Not configured";
    apiKeySection.querySelector(".warning-icon").textContent = "⚠️";
    configureApiBtn.textContent = "Configure";
  }
}

// Load selected text
async function loadSelectedText() {
  const result = await chrome.storage.local.get(["selectedText"]);
  if (result.selectedText) {
    sourceText.value = result.selectedText;
    updateCharCount();
    chrome.storage.local.remove("selectedText");
  }
}

// Update character count
function updateCharCount() {
  charCount.textContent = sourceText.value.length;
}

sourceText.addEventListener("input", updateCharCount);

// Configure button
configureApiBtn.addEventListener("click", () => {
  window.open(
    chrome.runtime.getURL("popup.html"),
    "apiConfig",
    "width=420,height=550,top=100,left=100"
  );
});

// Rate limiting
let lastTranslationTime = 0;
const MIN_TRANSLATION_INTERVAL = 2000; // 2 seconds minimum between translations

// Translate button
translateBtn.addEventListener("click", async () => {
  const text = sourceText.value.trim();

  if (!text) {
    showError("Please enter some text to translate.");
    return;
  }

  // Rate limiting check
  const now = Date.now();
  if (now - lastTranslationTime < MIN_TRANSLATION_INTERVAL) {
    showError(`Please wait ${Math.ceil((MIN_TRANSLATION_INTERVAL - (now - lastTranslationTime)) / 1000)}s before next translation.`);
    return;
  }

  const config = await chrome.storage.sync.get(["apiUrl", "apiKey", "modelName"]);

  if (!config.apiUrl || !config.apiKey || !config.modelName) {
    showError("Please configure API settings first.");
    return;
  }

  lastTranslationTime = now;
  await translateText(text, config);
});

// Detect API type from URL
function detectApiType(url) {
  if (url.includes("anthropic.com")) return "claude";
  if (url.includes("generativelanguage.googleapis.com")) return "gemini";
  return "openai"; // OpenAI, OpenRouter, and other OpenAI-compatible APIs
}

// Build request for Claude API
function buildClaudeRequest(text, config) {
  return {
    url: config.apiUrl,
    options: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: config.modelName,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `${TRANSLATION_PROMPT}\n\n"${text}"`
          }
        ]
      })
    }
  };
}

// Build request for OpenAI-compatible APIs
function buildOpenAIRequest(text, config) {
  return {
    url: config.apiUrl,
    options: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [
          {
            role: "user",
            content: `${TRANSLATION_PROMPT}\n\n"${text}"`
          }
        ],
        max_tokens: 1024,
        temperature: 0.3
      })
    }
  };
}

// Build request for Gemini API
function buildGeminiRequest(text, config) {
  // Gemini URL format: .../models/{model}:generateContent?key=API_KEY
  let url = config.apiUrl;
  if (!url.includes("?key=")) {
    url += (url.includes("?") ? "&" : "?") + `key=${config.apiKey}`;
  }

  return {
    url: url,
    options: {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${TRANSLATION_PROMPT}\n\n"${text}"`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ]
      })
    }
  };
}

// Parse Claude response
function parseClaudeResponse(data) {
  if (data.content && data.content[0]?.text) {
    return data.content[0].text;
  }
  return null;
}

// Parse OpenAI response
function parseOpenAIResponse(data) {
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  if (data.choices && data.choices[0]?.text) {
    return data.choices[0].text;
  }
  return null;
}

// Parse Gemini response
function parseGeminiResponse(data) {
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }
  return null;
}

// Translate text with retry logic
async function translateText(text, config, retryCount = 0, maxRetries = 3) {
  setLoading(true);
  hideError();

  try {
    const apiType = detectApiType(config.apiUrl);
    console.log("API Type detected:", apiType);
    console.log("Using model:", config.modelName);

    let request;
    let parseResponse;

    switch (apiType) {
      case "claude":
        request = buildClaudeRequest(text, config);
        parseResponse = parseClaudeResponse;
        break;
      case "gemini":
        request = buildGeminiRequest(text, config);
        parseResponse = parseGeminiResponse;
        break;
      default:
        request = buildOpenAIRequest(text, config);
        parseResponse = parseOpenAIResponse;
    }

    console.log("Request URL:", request.url);

    const response = await fetch(request.url, request.options);
    const data = await response.json();

    console.log("API Response:", data);

    if (!response.ok) {
      const errorMsg = data.error?.message || data.error?.type || JSON.stringify(data.error) || `Error ${response.status}`;
      
      // Handle rate limiting / quota exceeded (429 or 403)
      if ((response.status === 429 || response.status === 403) && retryCount < maxRetries) {
        const retryAfter = data.error?.message?.match(/retry in ([\d.]+)s/)?.[1] || (Math.pow(2, retryCount) + Math.random());
        const waitTime = Math.ceil(parseFloat(retryAfter) * 1000);
        
        showError(`Quota exceeded. Retrying in ${Math.ceil(waitTime / 1000)} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        setLoading(false);
        return translateText(text, config, retryCount + 1, maxRetries);
      }
      
      throw new Error(errorMsg);
    }

    const result = parseResponse(data);

    if (result) {
      translatedText.value = result.trim();
    } else {
      console.error("Could not parse response:", data);
      throw new Error("Could not parse API response");
    }

  } catch (error) {
    console.error("Translation error:", error);
    showError(error.message || "Translation failed");
  } finally {
    setLoading(false);
  }
}

// Copy to clipboard
copyBtn.addEventListener("click", async () => {
  const text = translatedText.value;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.classList.add("copied");
    copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    setTimeout(() => {
      copyBtn.classList.remove("copied");
      copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    }, 2000);
  } catch (error) {
    showError("Failed to copy");
  }
});

// UI helpers
function setLoading(loading) {
  translateBtn.disabled = loading;
  translateBtn.querySelector(".btn-text").style.display = loading ? "none" : "inline";
  translateBtn.querySelector(".btn-loading").style.display = loading ? "flex" : "none";
}

function showError(message) {
  errorText.textContent = message;
  errorMessage.style.display = "flex";
}

function hideError() {
  errorMessage.style.display = "none";
}

// Keyboard shortcut
sourceText.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    translateBtn.click();
  }
});
