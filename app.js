// ========================================
// Random Topic Generator & 아재개그 - Main App
// ========================================

// ========================
// Mode State
// ========================
let currentMode = 'rtg'; // 'rtg' | 'aje'

// ========================
// RTG State
// ========================
const rtgState = {
  categories: [],
  currentCategory: null,
  currentTopics: [],
  currentTopic: null,
  history: [],
  maxHistory: 5
};

// ========================
// Aje State
// ========================
const ajeState = {
  jokes: [],
  currentJoke: null,
  answerVisible: false
};

// ========================
// RTG DOM Elements
// ========================
const rtgElements = {
  categoryGrid: document.getElementById('categoryGrid'),
  topicText: document.getElementById('topicText'),
  topicDisplay: document.getElementById('topicDisplay'),
  generateBtn: document.getElementById('generateBtn'),
  copyBtn: document.getElementById('copyBtn'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  historyList: document.getElementById('historyList')
};

// ========================
// Aje DOM Elements
// ========================
const ajeElements = {
  questionText: document.getElementById('ajeQuestionText'),
  answerText: document.getElementById('ajeAnswerText'),
  answerBox: document.getElementById('ajeAnswerBox'),
  nextBtn: document.getElementById('ajeNextBtn'),
  revealBtn: document.getElementById('ajeRevealBtn')
};

// ========================================
// Initialization
// ========================================

// RTG JSON files with RTG_ prefix
const RTG_JSON_FILES = [
  'RTG_casual.json',
  'RTG_business.json',
  'RTG_family.json',
  'RTG_couple.json',
  'RTG_essay.json'
];

/**
 * Initialize the application
 */
async function init() {
  try {
    // Setup mode tab listeners
    setupModeTabs();

    // Load RTG categories
    await loadCategories();

    // Load Aje jokes
    await loadAjeJokes();

    // Load RTG history from localStorage
    loadHistory();

    // Setup event listeners
    setupEventListeners();

    console.log('✅ App initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing app:', error);
  }
}

// ========================================
// Mode Tab Management
// ========================================

function setupModeTabs() {
  const rtgTab = document.getElementById('tabRtg');
  const ajeTab = document.getElementById('tabAje');

  rtgTab.addEventListener('click', () => switchMode('rtg'));
  ajeTab.addEventListener('click', () => switchMode('aje'));
}

function switchMode(mode) {
  currentMode = mode;

  const rtgTab = document.getElementById('tabRtg');
  const ajeTab = document.getElementById('tabAje');
  const rtgSection = document.getElementById('rtgSection');
  const ajeSection = document.getElementById('ajeSection');

  if (mode === 'rtg') {
    rtgTab.classList.add('active');
    ajeTab.classList.remove('active');
    rtgSection.style.display = '';
    ajeSection.style.display = 'none';
  } else {
    ajeTab.classList.add('active');
    rtgTab.classList.remove('active');
    ajeSection.style.display = '';
    rtgSection.style.display = 'none';

    // Show a joke if none loaded yet
    if (ajeState.jokes.length > 0 && !ajeState.currentJoke) {
      nextAjeJoke();
    }
  }
}

// ========================================
// RTG - Category Management
// ========================================

/**
 * Load all RTG categories from JSON files
 */
async function loadCategories() {
  const categoryPromises = RTG_JSON_FILES.map(async (filename) => {
    try {
      const response = await fetch(filename);
      if (!response.ok) throw new Error(`Failed to load ${filename}`);

      const text = await response.text();
      const topics = parseTopics(text);
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
  rtgState.categories = categories.filter(cat => cat !== null);

  if (rtgState.categories.length === 0) {
    throw new Error('No categories loaded');
  }

  renderCategories();
}

/**
 * Parse topics from JSON file text (line-based format)
 */
function parseTopics(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('//'));
}

/**
 * Format category name from filename
 * - Strips RTG_ prefix
 * - Capitalizes each word
 * Examples:
 *   RTG_casual.json  -> Casual
 *   RTG_couple.json  -> Couple
 *   RTG_essay.json   -> Essay
 */
function formatCategoryName(filename) {
  // Remove .json and RTG_ prefix
  const name = filename.replace('.json', '').replace(/^RTG_/i, '');

  // Split by underscore or camelCase
  const words = name.split(/[_-]|(?=[A-Z])/);

  // Capitalize each word
  const formatted = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return formatted;
}

/**
 * Render category buttons
 */
function renderCategories() {
  rtgElements.categoryGrid.innerHTML = '';

  rtgState.categories.forEach(category => {
    const button = document.createElement('button');
    button.className = 'category-btn';
    button.id = `category-${category.id}`;
    button.textContent = category.name;
    button.setAttribute('data-category-id', category.id);
    button.setAttribute('aria-label', `Select ${category.name} category with ${category.count} topics`);

    button.addEventListener('click', () => selectCategory(category.id));

    rtgElements.categoryGrid.appendChild(button);
  });
}

/**
 * Select a RTG category
 */
function selectCategory(categoryId) {
  const category = rtgState.categories.find(cat => cat.id === categoryId);
  if (!category) return;

  rtgState.currentCategory = category;
  rtgState.currentTopics = category.topics;

  updateCategoryButtons(categoryId);
  enableGenerateButton();
  generateTopic();
}

/**
 * Update category button states
 */
function updateCategoryButtons(activeCategoryId) {
  const buttons = rtgElements.categoryGrid.querySelectorAll('.category-btn');
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
// RTG - Topic Generation
// ========================================

/**
 * Generate a random RTG topic
 */
function generateTopic() {
  if (!rtgState.currentTopics || rtgState.currentTopics.length === 0) {
    showError('No topics available for this category');
    return;
  }

  const randomIndex = Math.floor(Math.random() * rtgState.currentTopics.length);
  const topic = rtgState.currentTopics[randomIndex];

  rtgState.currentTopic = topic;
  displayTopic(topic);
  addToHistory(topic, rtgState.currentCategory.name);
  rtgElements.copyBtn.disabled = false;
}

/**
 * Display RTG topic with animation
 */
function displayTopic(topic) {
  const topicElement = rtgElements.topicText;

  topicElement.classList.add('changing');
  setTimeout(() => {
    topicElement.textContent = topic;
    topicElement.classList.remove('topic-placeholder');
  }, 200);
  setTimeout(() => {
    topicElement.classList.remove('changing');
  }, 400);
}

/**
 * Show RTG error message
 */
function showError(message) {
  rtgElements.topicText.textContent = message;
  rtgElements.topicText.classList.add('topic-placeholder');
}

/**
 * Enable generate button
 */
function enableGenerateButton() {
  rtgElements.generateBtn.disabled = false;
}

// ========================================
// RTG - History Management
// ========================================

function addToHistory(topic, categoryName) {
  const historyItem = {
    topic: topic,
    category: categoryName,
    timestamp: Date.now()
  };

  rtgState.history.unshift(historyItem);

  if (rtgState.history.length > rtgState.maxHistory) {
    rtgState.history = rtgState.history.slice(0, rtgState.maxHistory);
  }

  saveHistory();
  renderHistory();
}

function renderHistory() {
  if (rtgState.history.length === 0) {
    rtgElements.historyList.innerHTML = '<li class="history-empty">No topics generated yet</li>';
    return;
  }

  rtgElements.historyList.innerHTML = '';

  rtgState.history.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `
      <div><strong>${item.category}</strong></div>
      <div>${item.topic}</div>
    `;

    li.addEventListener('click', () => {
      copyToClipboard(item.topic);
      showCopyFeedback();
    });

    li.setAttribute('title', 'Click to copy');
    li.style.cursor = 'pointer';

    rtgElements.historyList.appendChild(li);
  });
}

function clearHistory() {
  rtgState.history = [];
  saveHistory();
  renderHistory();
}

function saveHistory() {
  try {
    localStorage.setItem('topicHistory', JSON.stringify(rtgState.history));
  } catch (error) {
    console.warn('Failed to save history:', error);
  }
}

function loadHistory() {
  try {
    const saved = localStorage.getItem('topicHistory');
    if (saved) {
      rtgState.history = JSON.parse(saved);
      renderHistory();
    }
  } catch (error) {
    console.warn('Failed to load history:', error);
  }
}

// ========================================
// Aje (아재개그) Management
// ========================================

/**
 * Load aje.json
 */
async function loadAjeJokes() {
  try {
    const response = await fetch('aje.json');
    if (!response.ok) throw new Error('Failed to load aje.json');
    const data = await response.json();
    // Filter out entries that have no answer
    ajeState.jokes = data.filter(item => item.q && item.a);
    console.log(`✅ Loaded ${ajeState.jokes.length} aje jokes`);
  } catch (error) {
    console.warn('⚠️ Could not load aje.json:', error);
  }
}

/**
 * Pick a random joke and display it
 */
function nextAjeJoke() {
  if (!ajeState.jokes || ajeState.jokes.length === 0) return;

  const randomIndex = Math.floor(Math.random() * ajeState.jokes.length);
  ajeState.currentJoke = ajeState.jokes[randomIndex];
  ajeState.answerVisible = false;

  // Update question display with animation
  const qEl = ajeElements.questionText;
  qEl.classList.add('changing');
  setTimeout(() => {
    qEl.textContent = ajeState.currentJoke.q;
    qEl.classList.remove('changing');
  }, 200);

  // Hide answer
  const answerBox = ajeElements.answerBox;
  answerBox.classList.remove('visible');
  ajeElements.answerText.textContent = '';

  // Reset reveal button
  ajeElements.revealBtn.textContent = '정답 보기';
  ajeElements.revealBtn.disabled = false;
}

/**
 * Reveal the answer
 */
function revealAjeAnswer() {
  if (!ajeState.currentJoke || ajeState.answerVisible) return;

  ajeState.answerVisible = true;
  ajeElements.answerText.textContent = ajeState.currentJoke.a;
  ajeElements.answerBox.classList.add('visible');
  ajeElements.revealBtn.textContent = '✓ 정답 공개됨';
  ajeElements.revealBtn.disabled = true;
}

// ========================================
// Clipboard & Utilities
// ========================================

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
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

function showCopyFeedback() {
  const originalText = rtgElements.copyBtn.innerHTML;
  rtgElements.copyBtn.innerHTML = '<span>✓</span><span>Copied!</span>';
  rtgElements.copyBtn.style.background = 'linear-gradient(135deg, hsl(140, 70%, 50%), hsl(160, 70%, 50%))';

  setTimeout(() => {
    rtgElements.copyBtn.innerHTML = originalText;
    rtgElements.copyBtn.style.background = '';
  }, 2000);
}

// ========================================
// Event Listeners
// ========================================

function setupEventListeners() {
  // RTG Buttons
  rtgElements.generateBtn.addEventListener('click', generateTopic);

  rtgElements.copyBtn.addEventListener('click', async () => {
    if (rtgState.currentTopic) {
      const success = await copyToClipboard(rtgState.currentTopic);
      if (success) {
        showCopyFeedback();
      } else {
        alert('Failed to copy to clipboard');
      }
    }
  });

  rtgElements.clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your topic history?')) {
      clearHistory();
    }
  });

  // Aje Buttons
  ajeElements.nextBtn.addEventListener('click', nextAjeJoke);
  ajeElements.revealBtn.addEventListener('click', revealAjeAnswer);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (currentMode === 'rtg') {
      if ((e.code === 'Space' || e.code === 'Enter') &&
        !rtgElements.generateBtn.disabled &&
        e.target.tagName !== 'BUTTON') {
        e.preventDefault();
        generateTopic();
      }
      if (e.code === 'KeyC' &&
        e.ctrlKey &&
        !rtgElements.copyBtn.disabled &&
        rtgState.currentTopic) {
        e.preventDefault();
        copyToClipboard(rtgState.currentTopic);
        showCopyFeedback();
      }
    } else {
      // Aje mode: Space/Enter for next joke, A for answer
      if ((e.code === 'Space' || e.code === 'Enter') &&
        e.target.tagName !== 'BUTTON') {
        e.preventDefault();
        nextAjeJoke();
      }
    }
  });
}

// ========================================
// Start Application
// ========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
