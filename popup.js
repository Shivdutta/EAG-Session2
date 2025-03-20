function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

// DOM Elements
const elements = {
  promptInput: document.getElementById('promptInput'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  saveApiKeyBtn: document.getElementById('saveApiKey'),
  submitPromptBtn: document.getElementById('submitPrompt'),
  loadingIndicator: document.getElementById('loadingIndicator'),
  errorMessage: document.getElementById('errorMessage'),
  responseText: document.getElementById('responseText')
};

// Load saved API key on popup open
chrome.storage.local.get(['geminiApiKey'], (result) => {
  if (result.geminiApiKey) {
    elements.apiKeyInput.value = result.geminiApiKey;
  }
});

// Save API key
elements.saveApiKeyBtn.addEventListener('click', () => {
  const apiKey = elements.apiKeyInput.value.trim();
  if (apiKey) {
    chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
      showError('API key saved successfully!', false);
    });
  } else {
    showError('Please enter a valid API key');
  }
});

// Handle form submission
elements.submitPromptBtn.addEventListener('click', async () => {
  const prompt = elements.promptInput.value.trim();
  const apiKey = elements.apiKeyInput.value.trim();

  if (!prompt) {
    showError('Please enter a prompt');
    return;
  }

  if (!apiKey) {
    showError('Please enter your API key');
    return;
  }

  try {
    // Show loading state
    setLoading(true);
    clearError();
    elements.responseText.textContent = '';

    const response = await fetchGeminiResponse(prompt, apiKey);
    
    // Display the response
    elements.responseText.textContent = response;
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
});

// Fetch response from Gemini API
async function fetchGeminiResponse(prompt, apiKey) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  
  const response = await fetch(`${url}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Extract the response text from the Gemini API response
  return data.candidates[0].content.parts[0].text;
}

// Utility functions
function setLoading(isLoading) {
  elements.loadingIndicator.classList.toggle('hidden', !isLoading);
  elements.submitPromptBtn.disabled = isLoading;
}

function showError(message, isError = true) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.style.color = isError ? '#d93025' : '#28a745';
  elements.errorMessage.classList.remove('hidden');
  
  // Hide error message after 3 seconds
  setTimeout(() => {
    elements.errorMessage.classList.add('hidden');
  }, 3000);
}

function clearError() {
  elements.errorMessage.classList.add('hidden');
  elements.errorMessage.textContent = '';
} 