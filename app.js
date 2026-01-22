// ========================================
// Random Topic Generator - Main App
// ========================================

// App State
const state = {
  categories: [],
  currentCategory: null,
  currentTopics: [],
  currentTopic: null,
  history: [],
  maxHistory: 5
};

// DOM Elements
const elements = {
  categoryGrid: document.getElementById('categoryGrid'),
  topicText: document.getElementById('topicText'),
  topicDisplay: document.getElementById('topicDisplay'),
  generateBtn: document.getElementById('generateBtn'),
  copyBtn: document.getElementById('copyBtn'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  historyList: document.getElementById('historyList')
};

// ========================================
// Initialization
// ========================================

// List of JSON files (manually defined for GitHub Pages compatibility)
const JSON_FILES = [
  'casual.json',
  'business.json',
  'family.json',
  'couple_topics.json',
  'essay_topics.json'
];

/**
 * Initialize the application
 */
async function init() {
  try {
    // Load categories
    await loadCategories();

    // Load history from localStorage
    loadHistory();

    // Setup event listeners
    setupEventListeners();

    console.log('✅ App initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing app:', error);
    showError('Failed to initialize application. Please refresh the page.');
  }
}

// ========================================
// Category Management
// ========================================

/**
 * Load all categories from JSON files
 */
async function loadCategories() {
  const categoryPromises = JSON_FILES.map(async (filename) => {
    try {
      const response = await fetch(filename);
      if (!response.ok) throw new Error(`Failed to load ${filename}`);

      const text = await response.text();
      const topics = parseTopics(text);

      // Create category name from filename
      const categoryName = formatCategoryName(filename);

      return {
        id: filename.replace('.json', ''),
        name: categoryName,
        filename: filename,
        topics: topics,
        count: topics.length
      };
    } catch (error) {
      console.warn(`⚠️ Could not load ${filename}:`, error);
      return null;
    }
  });

  const categories = await Promise.all(categoryPromises);
  state.categories = categories.filter(cat => cat !== null);

  if (state.categories.length === 0) {
    throw new Error('No categories loaded');
  }

  renderCategories();
}

/**
 * Parse topics from JSON file text
 * Handles line-based format
 */
function parseTopics(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('//'));
}

/**
 * Format category name from filename
 * Examples: 
 *   - business.json -> Business Topics
 *   - couple_topics.json -> Couple Topics
 */
function formatCategoryName(filename) {
  const name = filename.replace('.json', '');

  // Split by underscore or camelCase
  const words = name.split(/[_-]|(?=[A-Z])/);

  // Capitalize each word
  const formatted = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return formatted + ' Topics';
}

/**
 * Render category buttons
 */
function renderCategories() {
  elements.categoryGrid.innerHTML = '';

  state.categories.forEach(category => {
    const button = document.createElement('button');
    button.className = 'category-btn';
    button.id = `category-${category.id}`;
    button.textContent = category.name;
    button.setAttribute('data-category-id', category.id);
    button.setAttribute('aria-label', `Select ${category.name} category with ${category.count} topics`);

    button.addEventListener('click', () => selectCategory(category.id));

    elements.categoryGrid.appendChild(button);
  });
}

/**
 * Select a category
 */
function selectCategory(categoryId) {
  const category = state.categories.find(cat => cat.id === categoryId);
  if (!category) return;

  state.currentCategory = category;
  state.currentTopics = category.topics;

  // Update UI
  updateCategoryButtons(categoryId);
  enableGenerateButton();

  // Auto-generate first topic
  generateTopic();
}

/**
 * Update category button states
 */
function updateCategoryButtons(activeCategoryId) {
  const buttons = elements.categoryGrid.querySelectorAll('.category-btn');
  buttons.forEach(btn => {
    const categoryId = btn.getAttribute('data-category-id');
    if (categoryId === activeCategoryId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// ========================================
// Topic Generation
// ========================================

/**
 * Generate a random topic
 */
function generateTopic() {
  if (!state.currentTopics || state.currentTopics.length === 0) {
    showError('No topics available for this category');
    return;
  }

  // Get random topic
  const randomIndex = Math.floor(Math.random() * state.currentTopics.length);
  const topic = state.currentTopics[randomIndex];

  // Update state
  state.currentTopic = topic;

  // Display topic with animation
  displayTopic(topic);

  // Add to history
  addToHistory(topic, state.currentCategory.name);

  // Enable copy button
  elements.copyBtn.disabled = false;
}

/**
 * Display topic with animation
 */
function displayTopic(topic) {
  const topicElement = elements.topicText;

  // Add animation class
  topicElement.classList.add('changing');

  // Update text after animation starts
  setTimeout(() => {
    topicElement.textContent = topic;
    topicElement.classList.remove('topic-placeholder');
  }, 200);

  // Remove animation class
  setTimeout(() => {
    topicElement.classList.remove('changing');
  }, 400);
}

/**
 * Show error message
 */
function showError(message) {
  elements.topicText.textContent = message;
  elements.topicText.classList.add('topic-placeholder');
}

// ========================================
// History Management
// ========================================

/**
 * Add topic to history
 */
function addToHistory(topic, categoryName) {
  const historyItem = {
    topic: topic,
    category: categoryName,
    timestamp: Date.now()
  };

  // Add to beginning of array
  state.history.unshift(historyItem);

  // Keep only max items
  if (state.history.length > state.maxHistory) {
    state.history = state.history.slice(0, state.maxHistory);
  }

  // Save to localStorage
  saveHistory();

  // Render history
  renderHistory();
}

/**
 * Render history list
 */
function renderHistory() {
  if (state.history.length === 0) {
    elements.historyList.innerHTML = '<li class="history-empty">No topics generated yet</li>';
    return;
  }

  elements.historyList.innerHTML = '';

  state.history.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `
      <div><strong>${item.category}</strong></div>
      <div>${item.topic}</div>
    `;

    // Add click to copy functionality
    li.addEventListener('click', () => {
      copyToClipboard(item.topic);
      showCopyFeedback();
    });

    li.setAttribute('title', 'Click to copy');
    li.style.cursor = 'pointer';

    elements.historyList.appendChild(li);
  });
}

/**
 * Clear history
 */
function clearHistory() {
  state.history = [];
  saveHistory();
  renderHistory();
}

/**
 * Save history to localStorage
 */
function saveHistory() {
  try {
    localStorage.setItem('topicHistory', JSON.stringify(state.history));
  } catch (error) {
    console.warn('Failed to save history:', error);
  }
}

/**
 * Load history from localStorage
 */
function loadHistory() {
  try {
    const saved = localStorage.getItem('topicHistory');
    if (saved) {
      state.history = JSON.parse(saved);
      renderHistory();
    }
  } catch (error) {
    console.warn('Failed to load history:', error);
  }
}

// ========================================
// Clipboard & Utilities
// ========================================

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (err) {
      document.body.removeChild(textarea);
      console.error('Failed to copy:', err);
      return false;
    }
  }
}

/**
 * Show copy feedback
 */
function showCopyFeedback() {
  const originalText = elements.copyBtn.innerHTML;
  elements.copyBtn.innerHTML = '<span>✓</span><span>Copied!</span>';
  elements.copyBtn.style.background = 'linear-gradient(135deg, hsl(140, 70%, 50%), hsl(160, 70%, 50%))';

  setTimeout(() => {
    elements.copyBtn.innerHTML = originalText;
    elements.copyBtn.style.background = '';
  }, 2000);
}

/**
 * Enable generate button
 */
function enableGenerateButton() {
  elements.generateBtn.disabled = false;
}

// ========================================
// Event Listeners
// ========================================

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Generate button
  elements.generateBtn.addEventListener('click', generateTopic);

  // Copy button
  elements.copyBtn.addEventListener('click', async () => {
    if (state.currentTopic) {
      const success = await copyToClipboard(state.currentTopic);
      if (success) {
        showCopyFeedback();
      } else {
        alert('Failed to copy to clipboard');
      }
    }
  });

  // Clear history button
  elements.clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your topic history?')) {
      clearHistory();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Space or Enter to generate (when button is enabled)
    if ((e.code === 'Space' || e.code === 'Enter') &&
      !elements.generateBtn.disabled &&
      e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      generateTopic();
    }

    // C to copy (when copy button is enabled)
    if (e.code === 'KeyC' &&
      e.ctrlKey &&
      !elements.copyBtn.disabled &&
      state.currentTopic) {
      e.preventDefault();
      copyToClipboard(state.currentTopic);
      showCopyFeedback();
    }
  });
}

// ========================================
// Start Application
// ========================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
