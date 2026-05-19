/**
 * FeedGuard AI - Background Service Worker (Manifest V3)
 * Handles inter-script messaging, alarm management, and storage initialization.
 */

const BACKEND_URL = 'http://localhost:3001';

/** Default settings applied on first install */
const DEFAULT_SETTINGS = {
  clickbaitFilter: true,
  doomscrollTimer: true,
  aiSummarize: true,
  toxicFilter: true,
  timeLimit: 30, // minutes
};

/** Default stats object for daily tracking */
const DEFAULT_STATS = {
  videosFiltered: 0,
  timeSpent: 0,       // in seconds
  toxicBlocked: 0,
  date: new Date().toISOString().split('T')[0],
};

// ─── Initialization ───────────────────────────────────────────────────────────

/**
 * Runs on extension install/update.
 * Seeds chrome.storage.sync with default settings if not already present.
 */
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.sync.get('settings');
  if (!existing.settings) {
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    console.log('[FeedGuard] Default settings initialized.');
  }

  const existingStats = await chrome.storage.local.get('stats');
  if (!existingStats.stats) {
    await chrome.storage.local.set({ stats: DEFAULT_STATS });
    console.log('[FeedGuard] Default stats initialized.');
  }
});

// ─── Alarm for daily stats reset ─────────────────────────────────────────────

chrome.alarms.create('dailyReset', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyReset') {
    const today = new Date().toISOString().split('T')[0];
    const { stats } = await chrome.storage.local.get('stats');
    if (stats && stats.date !== today) {
      await chrome.storage.local.set({
        stats: { ...DEFAULT_STATS, date: today },
      });
      console.log('[FeedGuard] Daily stats reset for:', today);
    }
  }
});

// ─── Message Handling ─────────────────────────────────────────────────────────

/**
 * Central message router for content scripts and popup.
 * All Groq API calls are proxied through the backend via this service worker.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_SETTINGS':
      handleGetSettings(sendResponse);
      break;

    case 'UPDATE_STATS':
      handleUpdateStats(message.payload, sendResponse);
      break;

    case 'GET_STATS':
      handleGetStats(sendResponse);
      break;

    case 'SUMMARIZE':
      handleSummarize(message.payload, sendResponse);
      break;

    case 'ANALYZE_TWEET':
      handleAnalyzeTweet(message.payload, sendResponse);
      break;

    default:
      sendResponse({ error: 'Unknown message type' });
  }

  // Return true to keep the message channel open for async responses
  return true;
});

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * Retrieves current settings from chrome.storage.sync.
 * @param {function} sendResponse - Callback to send data back to caller
 */
async function handleGetSettings(sendResponse) {
  try {
    const { settings } = await chrome.storage.sync.get('settings');
    sendResponse({ settings: settings || DEFAULT_SETTINGS });
  } catch (err) {
    console.error('[FeedGuard] GET_SETTINGS error:', err);
    sendResponse({ error: err.message });
  }
}

/**
 * Merges incremental stat updates into chrome.storage.local.
 * @param {{ videosFiltered?: number, toxicBlocked?: number, timeSpent?: number }} payload
 * @param {function} sendResponse
 */
async function handleUpdateStats(payload, sendResponse) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { stats } = await chrome.storage.local.get('stats');
    const current = stats && stats.date === today ? stats : { ...DEFAULT_STATS, date: today };

    const updated = {
      ...current,
      videosFiltered: (current.videosFiltered || 0) + (payload.videosFiltered || 0),
      toxicBlocked: (current.toxicBlocked || 0) + (payload.toxicBlocked || 0),
      timeSpent: (current.timeSpent || 0) + (payload.timeSpent || 0),
    };

    await chrome.storage.local.set({ stats: updated });
    sendResponse({ success: true, stats: updated });
  } catch (err) {
    console.error('[FeedGuard] UPDATE_STATS error:', err);
    sendResponse({ error: err.message });
  }
}

/**
 * Returns today's stats from chrome.storage.local.
 * @param {function} sendResponse
 */
async function handleGetStats(sendResponse) {
  try {
    const { stats } = await chrome.storage.local.get('stats');
    sendResponse({ stats: stats || DEFAULT_STATS });
  } catch (err) {
    console.error('[FeedGuard] GET_STATS error:', err);
    sendResponse({ error: err.message });
  }
}

/**
 * Proxies a summarization request to the backend /api/summarize endpoint.
 * @param {{ title: string, description: string }} payload
 * @param {function} sendResponse
 */
async function handleSummarize(payload, sendResponse) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    sendResponse({ summary: data.summary });
  } catch (err) {
    console.error('[FeedGuard] SUMMARIZE error:', err);
    sendResponse({ error: err.message });
  }
}

/**
 * Proxies a tweet analysis request to the backend /api/analyze endpoint.
 * @param {{ text: string }} payload
 * @param {function} sendResponse
 */
async function handleAnalyzeTweet(payload, sendResponse) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    sendResponse(data);
  } catch (err) {
    console.error('[FeedGuard] ANALYZE_TWEET error:', err);
    sendResponse({ error: err.message });
  }
}
