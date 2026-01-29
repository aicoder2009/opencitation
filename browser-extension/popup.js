// OpenCitation Browser Extension - Popup Script

// Configuration
const API_BASE_URL = "http://localhost:3000"; // Change to production URL

// State
let currentStyle = "apa";
let currentCitation = null;
let pageInfo = null;

// DOM Elements
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const errorMessageEl = document.getElementById("error-message");
const styleSelector = document.getElementById("style-selector");
const citationResult = document.getElementById("citation-result");
const citationText = document.getElementById("citation-text");
const generateSection = document.getElementById("generate-section");
const generateBtn = document.getElementById("generate-btn");
const copyBtn = document.getElementById("copy-btn");
const openBtn = document.getElementById("open-btn");
const retryBtn = document.getElementById("retry-btn");
const copyFeedback = document.getElementById("copy-feedback");
const pageTitleDisplay = document.getElementById("page-title-display");
const pageUrlDisplay = document.getElementById("page-url-display");
const styleTabs = document.querySelectorAll(".style-tab");

// Initialize
document.addEventListener("DOMContentLoaded", init);

async function init() {
  // Get current tab info
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    pageInfo = {
      url: tab.url,
      title: tab.title,
    };

    pageTitleDisplay.textContent = pageInfo.title || "Untitled Page";
    pageUrlDisplay.textContent = pageInfo.url;
  } catch (err) {
    console.error("Failed to get tab info:", err);
    pageTitleDisplay.textContent = "Unable to get page info";
  }

  // Load saved style preference
  const saved = await chrome.storage.local.get(["citationStyle"]);
  if (saved.citationStyle) {
    currentStyle = saved.citationStyle;
    updateStyleTabs();
  }

  // Set up event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Style tabs
  styleTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      currentStyle = tab.dataset.style;
      updateStyleTabs();
      chrome.storage.local.set({ citationStyle: currentStyle });

      // If we already have a citation, regenerate it
      if (currentCitation) {
        displayCitation();
      }
    });
  });

  // Generate button
  generateBtn.addEventListener("click", generateCitation);

  // Copy button
  copyBtn.addEventListener("click", copyCitation);

  // Open in app button
  openBtn.addEventListener("click", openInApp);

  // Retry button
  retryBtn.addEventListener("click", () => {
    hideError();
    generateCitation();
  });
}

function updateStyleTabs() {
  styleTabs.forEach((tab) => {
    if (tab.dataset.style === currentStyle) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });
}

async function generateCitation() {
  if (!pageInfo?.url) {
    showError("Unable to get page URL");
    return;
  }

  showLoading();
  hideError();
  hideCitation();

  try {
    // Call the lookup API
    const response = await fetch(`${API_BASE_URL}/api/lookup/url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: pageInfo.url,
        style: currentStyle,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to generate citation");
    }

    currentCitation = result.data;
    displayCitation();
  } catch (err) {
    console.error("Failed to generate citation:", err);
    showError(err.message || "Failed to generate citation. Is the server running?");
  } finally {
    hideLoading();
  }
}

function displayCitation() {
  if (!currentCitation) return;

  // Get the citation for current style
  const styleData = currentCitation.citations?.[currentStyle];

  if (styleData) {
    citationText.innerHTML = styleData.html || styleData.text;
  } else {
    // Fallback: use the first available style
    const firstStyle = Object.keys(currentCitation.citations || {})[0];
    if (firstStyle) {
      citationText.innerHTML = currentCitation.citations[firstStyle].html || currentCitation.citations[firstStyle].text;
    } else {
      citationText.textContent = "Citation not available";
    }
  }

  showCitation();
}

function copyCitation() {
  if (!currentCitation) return;

  const styleData = currentCitation.citations?.[currentStyle];
  const text = styleData?.text || citationText.textContent;

  navigator.clipboard.writeText(text).then(() => {
    showCopyFeedback();
  }).catch((err) => {
    console.error("Failed to copy:", err);
  });
}

function openInApp() {
  const url = `${API_BASE_URL}/cite?url=${encodeURIComponent(pageInfo.url)}`;
  chrome.tabs.create({ url });
}

// UI Helpers
function showLoading() {
  loadingEl.classList.remove("hidden");
  generateSection.classList.add("hidden");
}

function hideLoading() {
  loadingEl.classList.add("hidden");
  generateSection.classList.remove("hidden");
}

function showError(message) {
  errorMessageEl.textContent = message;
  errorEl.classList.remove("hidden");
  generateSection.classList.add("hidden");
}

function hideError() {
  errorEl.classList.add("hidden");
}

function showCitation() {
  citationResult.classList.remove("hidden");
  generateSection.classList.add("hidden");
}

function hideCitation() {
  citationResult.classList.add("hidden");
}

function showCopyFeedback() {
  copyFeedback.classList.remove("hidden");
  setTimeout(() => {
    copyFeedback.classList.add("hidden");
  }, 2000);
}
