// Popup JavaScript for API configuration

const apiUrlInput = document.getElementById("apiUrl");
const apiKeyInput = document.getElementById("apiKey");
const modelNameInput = document.getElementById("modelName");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const status = document.getElementById("status");
const currentConfigSection = document.getElementById("currentConfigSection");
const currentConfig = document.getElementById("currentConfig");
const presetBtns = document.querySelectorAll(".preset-btn");

// Presets configuration
const PRESETS = {
  claude: {
    url: "https://api.anthropic.com/v1/messages",
    model: "claude-3-haiku-20240307",
    keyPrefix: "sk-ant-"
  },
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    keyPrefix: "sk-"
  },
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: "anthropic/claude-3-haiku",
    keyPrefix: "sk-or-"
  },
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    model: "gemini-1.5-flash",
    keyPrefix: "AIza"
  },
  aiStudio: {
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    model: "gemini-1.5-flash",
    keyPrefix: "AIza"
  }
};

// Load existing settings
document.addEventListener("DOMContentLoaded", async () => {
  const result = await chrome.storage.sync.get(["apiUrl", "apiKey", "modelName"]);

  if (result.apiUrl) apiUrlInput.value = result.apiUrl;
  if (result.modelName) modelNameInput.value = result.modelName;

  if (result.apiKey) {
    currentConfig.innerHTML = `
      URL: ${result.apiUrl || "Not set"}<br>
      Key: ${maskApiKey(result.apiKey)}<br>
      Model: ${result.modelName || "Not set"}
    `;
    currentConfigSection.style.display = "block";
    clearBtn.style.display = "block";
    saveBtn.textContent = "Update Settings";
  }
});

// Preset buttons
presetBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const preset = PRESETS[btn.dataset.preset];
    if (preset) {
      apiUrlInput.value = preset.url;
      modelNameInput.value = preset.model;
      apiKeyInput.placeholder = `${preset.keyPrefix}...`;
      showStatus(`${btn.dataset.preset} preset loaded`, "success");
    }
  });
});

// Mask API key
function maskApiKey(key) {
  if (!key || key.length <= 8) return "********";
  return key.substring(0, 8) + "********" + key.substring(key.length - 4);
}

// Save settings
saveBtn.addEventListener("click", async () => {
  const apiUrl = apiUrlInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const modelName = modelNameInput.value.trim();

  // Get existing key if not provided
  const existing = await chrome.storage.sync.get(["apiKey"]);

  if (!apiUrl) {
    showStatus("Please enter API URL", "error");
    return;
  }

  if (!apiKey && !existing.apiKey) {
    showStatus("Please enter API Key", "error");
    return;
  }

  if (!modelName) {
    showStatus("Please enter Model Name", "error");
    return;
  }

  try {
    const settings = {
      apiUrl: apiUrl,
      modelName: modelName
    };

    if (apiKey) {
      settings.apiKey = apiKey;
    }

    await chrome.storage.sync.set(settings);

    const savedKey = apiKey || existing.apiKey;
    currentConfig.innerHTML = `
      URL: ${apiUrl}<br>
      Key: ${maskApiKey(savedKey)}<br>
      Model: ${modelName}
    `;
    currentConfigSection.style.display = "block";
    clearBtn.style.display = "block";
    saveBtn.textContent = "Update Settings";
    apiKeyInput.value = "";

    showStatus("Settings saved!", "success");
  } catch (error) {
    showStatus("Failed to save", "error");
  }
});

// Clear settings
clearBtn.addEventListener("click", async () => {
  await chrome.storage.sync.remove(["apiUrl", "apiKey", "modelName"]);

  apiUrlInput.value = "";
  apiKeyInput.value = "";
  modelNameInput.value = "";
  currentConfigSection.style.display = "none";
  clearBtn.style.display = "none";
  saveBtn.textContent = "Save Settings";

  showStatus("Settings cleared", "success");
});

// Show status
function showStatus(message, type) {
  status.textContent = message;
  status.className = `status ${type}`;
  setTimeout(() => { status.className = "status"; }, 3000);
}

// Enter to save
[apiUrlInput, apiKeyInput, modelNameInput].forEach(input => {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveBtn.click();
  });
});
