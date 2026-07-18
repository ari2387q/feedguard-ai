/**
 * FeedGuard AI - Background Service Worker (Manifest V3)
 * Handles inter-script messaging, alarm management, and storage initialization.
 */

const BACKEND_URL = 'https://feedguard.onrender.com';

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
  const { userId } = await chrome.storage.local.get('userId');
  if (!userId) {
      await chrome.storage.local.set({ userId: crypto.randomUUID() });
  }
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
    case 'CHECK_SPAM':
      handleCheckSpam(message.payload, sendResponse);
      break;
    case 'CHECK_TOXIC':
      handleCheckToxic(message.payload, sendResponse);
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

    // Sync summary stats to the backend so the dashboard matches extension activity.
    const syncSuccess = await postStatsToBackend({
      userId: await getUserId(),
      videosFiltered: payload.videosFiltered || 0,
      toxicBlocked: payload.toxicBlocked || 0,
      timeSpent: payload.timeSpent || 0,
    });

    if (syncSuccess) {
      await chrome.storage.local.set({ syncedStats: updated });
    }

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

async function postStatsToBackend(payload) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read body');
      throw new Error(`Backend sync failed: ${response.status} ${errorText}`);
    }

    return true;
  } catch (err) {
    console.warn('[FeedGuard] postStatsToBackend error:', err);
    return false;
  }
}

async function syncLocalStatsToBackend() {
  try {
    const { stats, syncedStats } = await chrome.storage.local.get(['stats', 'syncedStats']);
    if (!stats) return;

    const last = syncedStats || { videosFiltered: 0, toxicBlocked: 0, timeSpent: 0, date: stats.date };
    const delta = {
      userId: await getUserId(),
      videosFiltered: Math.max(0, stats.videosFiltered - (last.videosFiltered || 0)),
      toxicBlocked: Math.max(0, stats.toxicBlocked - (last.toxicBlocked || 0)),
      timeSpent: Math.max(0, stats.timeSpent - (last.timeSpent || 0)),
    };

    const hasDelta = delta.videosFiltered || delta.toxicBlocked || delta.timeSpent;
    if (!hasDelta) return;

    const success = await postStatsToBackend(delta);
    if (success) {
      await chrome.storage.local.set({ syncedStats: stats });
    }
  } catch (err) {
    console.warn('[FeedGuard] syncLocalStatsToBackend error:', err);
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
async function handleCheckSpam(payload, sendResponse) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/spam`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: payload.text }),
        });
        const data = await response.json();
        sendResponse(data);
    } catch (err) {
        console.error('[FeedGuard] CHECK_SPAM error:', err);
        sendResponse(null);
    }
}
async function handleCheckToxic(payload, sendResponse) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/toxic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: payload.text }),
    });
    const data = await response.json();
    sendResponse(data);
  } catch (err) {
    console.error('[FeedGuard] CHECK_TOXIC error:', err);
    sendResponse(null);
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
      const errorBody = await response.text().catch(() => 'Unable to read body');
      throw new Error(`Backend returned ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    sendResponse(data);
  } catch (err) {
    console.error('[FeedGuard] ANALYZE_TWEET error:', err);
    sendResponse({ error: err instanceof Error ? err.message : String(err) });
  }
}

syncLocalStatsToBackend().catch((err) => {
  console.warn('[FeedGuard] Initial stats sync error:', err);
});

async function getUserId(){
  const {userId}= await chrome.storage.local.get('userId')
  if (userId) return userId;
  const newId=crypto.randomUUID();
  await chrome.storage.local.set({userId:newId})
  return newId;
}

