
(function () {
  'use strict';

  // Cross-browser API compatibility shim
  const ext = typeof browser !== 'undefined' ? browser : chrome; // eslint-disable-line no-undef

  /** @type {{ clickbaitFilter: boolean, doomscrollTimer: boolean, aiSummarize: boolean, toxicFilter: boolean, timeLimit: number }} */
  let settings = {
    toxicFilter: true,
    spamFilter: true,
  };

  /** @type {WeakSet<Element>} Tracks already-processed tweet elements */
  const processedTweets = new WeakSet();

  /** @type {Map<string, { toxic: boolean, ragebait: boolean, clickbait: boolean, reason: string }>} */
  const analysisCache = new Map();

  // Local Heuristic Scoring

  const TOXIC_KEYWORDS = [
    'trash', 'garbage',
    'kill yourself', 'kys', 'die', 'worthless', 'retard', 'retarded',
    'clown', 'brain dead', 'braindead', 'degenerate',
    'scum', 'subhuman', 'piece of shit', 'cry harder', 'cope harder',
    'seethe', 'ratio +', 'kill urself', 'loser', 'asshole', 'bastard',
  ];

  const RAGEBAIT_KEYWORDS = [
    ,
    'can\'t believe',
    'outrageous',
    'shocking truth',
    'you need to hear this',
    'wake up',
    'nobody talks about',
    'everyone is ignoring',
    'they\'re hiding',
    'the media won\'t show',
    'you won\'t believe',
    'you won\'t believe what',
    'must see',
    'must read',
    'don\'t miss',
    'no one is talking about',
    'the truth about',
    'you need to know',
    'you need to hear',
    'here\'s why',
    'bet you didn\'t know',
    'media is lying',
    'they don\'t want you to see',
    'proof that',
  ];

  /**
   * Returns true if the text matches immediate toxic or rage-bait keywords.
   * @param {string} text
   * @returns {{ likelyToxic: boolean, likelyRagebait: boolean, reason: string }}
   */
  function quickHeuristicCheck(text) {
    if (!text) return { likelyToxic: false, likelyRagebait: false, reason: '' };
    const lower = text.toLowerCase();

    for (const kw of TOXIC_KEYWORDS) {
      if (lower.includes(kw)) {
        return { likelyToxic: true, likelyRagebait: false, reason: `Toxic keyword detected: "${kw}"` };
      }
    }

    for (const kw of RAGEBAIT_KEYWORDS) {
      if (lower.includes(kw)) {
        return { likelyToxic: false, likelyRagebait: true, reason: `Rage-bait pattern detected: "${kw}"` };
      }
    }

    return { likelyToxic: false, likelyRagebait: false, reason: '' };
  }

  //Badge Injection
  /**
   * Injects a warning banner above a tweet article element.
   * @param {Element} article - The tweet article element
   * @param {{ toxic: boolean, ragebait: boolean, reason: string }} result
   */
  function injectWarningBadge(article, result) {
    if (article.querySelector('.fg-tweet-warning')) return;

    const { toxic, ragebait, reason } = result;
    const isToxic = toxic;
    const isRage = ragebait;

    const banner = document.createElement('div');
    banner.className = 'fg-tweet-warning';
    banner.style.cssText = `
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      border-left: 3px solid ${isToxic ? '#ef4444' : '#f59e0b'};
      background: ${isToxic ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)'};
      margin: 4px 12px 4px 12px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    const icon = isToxic ? '☣️' : '⚠️';
    const label = isToxic
      ? 'Toxic Content Detected'
      : isRage
      ? 'Rage Bait Detected'
      : 'Potentially Harmful';

    // Build banner content using safe DOM API (no innerHTML with dynamic data)
    const iconEl = document.createElement('span');
    iconEl.style.cssText = 'font-size: 18px; flex-shrink: 0;';
    iconEl.textContent = icon;

    const textWrap = document.createElement('div');
    textWrap.style.cssText = 'flex: 1; min-width: 0;';

    const titleEl = document.createElement('div');
    titleEl.style.cssText = `font-weight: 700; font-size: 13px; color: ${isToxic ? '#fca5a5' : '#fcd34d'}; margin-bottom: 3px;`;
    titleEl.textContent = `\uD83D\uDEE1 FeedGuard \u2014 ${label}`;

    const reasonEl = document.createElement('div');
    reasonEl.style.cssText = 'font-size: 12px; color: #94a3b8; line-height: 1.4;';
    reasonEl.textContent = reason || 'This content may be harmful or designed to provoke anger.';

    const revealBtn = document.createElement('button');
    revealBtn.className = 'fg-reveal-btn';
    revealBtn.style.cssText = `
      margin-top: 6px; background: transparent; border: 1px solid #334155;
      color: #64748b; font-size: 11px; padding: 2px 10px; border-radius: 20px;
      cursor: pointer; font-family: inherit;
    `;
    revealBtn.textContent = 'Show tweet anyway';

    textWrap.appendChild(titleEl);
    textWrap.appendChild(reasonEl);
    textWrap.appendChild(revealBtn);
    banner.appendChild(iconEl);
    banner.appendChild(textWrap);

    // Insert the banner before the tweet's main content
    const tweetContent = article.querySelector('[data-testid="tweetText"]');
    if (tweetContent) {
      tweetContent.style.filter = 'blur(4px)';
      tweetContent.style.transition = 'filter 0.3s ease';
    }

    article.insertBefore(banner, article.firstChild);

    revealBtn.addEventListener('click', () => {
      banner.remove();
      if (tweetContent) tweetContent.style.filter = 'none';
    });
  }
  function isContextValid() {
    try {
      return Boolean(ext && ext.runtime && ext.runtime.id);
    } catch {
      return false;
    }
  }

  /**
   * Resilient wrapper around ext.runtime.sendMessage.
   * Handles inactive service worker wakeups and silently handles extension context invalidation.
   */
  async function safeSendMessage(message) {
    if (!isContextValid()) return null;
    try {
      return await ext.runtime.sendMessage(message);
    } catch (err) {
      if (err?.message?.includes('Extension context invalidated')) {
        return null;
      }
      if (
        err?.message?.includes('Receiving end does not exist') ||
        err?.message?.includes('Could not establish connection')
      ) {
        await new Promise((r) => setTimeout(r, 300));
        try {
          if (!isContextValid()) return null;
          return await ext.runtime.sendMessage(message);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  // NEW - goes through background.js
  async function checkSpam(text) {
    return safeSendMessage({ type: 'CHECK_SPAM', payload: { text } });
  }

  // To check the toxicity
  async function checkToxic(text) {
    return safeSendMessage({ type: 'CHECK_TOXIC', payload: { text } });
  }
  // Concurrency Limiter & Timeout helpers for ML/LLM requests
  function withTimeout(promise, ms = 2500) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
    ]);
  }

  let activeRequests = 0;
  const MAX_CONCURRENT = 3;
  const requestQueue = [];

  function enqueueAnalysis(fn) {
    return new Promise((resolve) => {
      requestQueue.push({ fn, resolve });
      drainQueue();
    });
  }

  function drainQueue() {
    if (activeRequests >= MAX_CONCURRENT || requestQueue.length === 0) return;
    const { fn, resolve } = requestQueue.shift();
    activeRequests++;
    fn()
      .then(resolve)
      .catch(() => resolve(null))
      .finally(() => {
        activeRequests--;
        drainQueue();
      });
  }

  // Tweet Analysis
  /**
   * Analyzes a single tweet element using the Tri-Layer pipeline:
   * Layer 1: Local Heuristics (0ms, 100% offline)
   * Layer 2: Fast ML microservice check (queued)
   * Layer 3: Groq LLM escalation for nuanced text (queued)
   * @param {Element} article - Tweet article DOM element
   */
  async function analyzeTweet(article) {
    if (processedTweets.has(article)) return;
    processedTweets.add(article);

    const textEl = article.querySelector('[data-testid="tweetText"]');
    if (!textEl) return;

    const text = textEl.textContent.trim();
    if (!text || text.length < 3) return;

    // Cache check
    if (analysisCache.has(text)) {
      const cached = analysisCache.get(text);
      if (cached.toxic || cached.ragebait) {
        injectWarningBadge(article, cached);
      }
      return;
    }

    // ─── Layer 1: Instant Local Heuristic Pre-Screen (0ms) ────────────────
    const heuristic = quickHeuristicCheck(text);
    if (heuristic.likelyToxic || heuristic.likelyRagebait) {
      const heuristicData = {
        toxic: heuristic.likelyToxic,
        ragebait: heuristic.likelyRagebait,
        clickbait: false,
        reason: heuristic.reason || 'Flagged by FeedGuard heuristic rules',
      };
      analysisCache.set(text, heuristicData);
      injectWarningBadge(article, heuristicData);
      updateToxicStats();
      return;
    }

    // ─── Layer 2 & 3: Queued ML & AI Analysis (Non-blocking) ─────────────
    enqueueAnalysis(async () => {
      // Re-check cache in case processed while queued
      if (analysisCache.has(text)) {
        const cached = analysisCache.get(text);
        if (cached.toxic || cached.ragebait) {
          injectWarningBadge(article, cached);
        }
        return;
      }

      // Layer 2A: ML spam check
      if (settings.spamFilter) {
        const spamResult = await withTimeout(checkSpam(text), 2000).catch(() => null);
        if (spamResult && spamResult.label === 'SPAM' && (spamResult.confidence || 0) >= 65) {
          const spamData = {
            toxic: false,
            ragebait: false,
            clickbait: false,
            reason: `ML spam detector flagged this (${spamResult.confidence}% confident)`,
          };
          analysisCache.set(text, spamData);
          injectWarningBadge(article, spamData);
          updateSpamStats();
          return;
        }
      }

      // Layer 2B: ML toxic check
      const toxicResult = await withTimeout(checkToxic(text), 2000).catch(() => null);
      if (toxicResult && toxicResult.label === 'TOXIC' && (toxicResult.confidence || 0) >= 65) {
        const toxicData = {
          toxic: true,
          ragebait: false,
          clickbait: false,
          reason: `ML toxicity model flagged this (${toxicResult.confidence}% confident)`,
        };
        analysisCache.set(text, toxicData);
        injectWarningBadge(article, toxicData);
        updateToxicStats();
        return;
      }

      // Layer 3: Escalate to Groq LLM for nuanced posts
      const isProvocative = /[!?]{2,}/.test(text) || text.length > 80;
      if (isProvocative) {
        try {
          const result = await withTimeout(
            safeSendMessage({
              type: 'ANALYZE_TWEET',
              payload: { text },
            }),
            3500
          ).catch(() => null);

          if (result && !result.error && (result.toxic || result.ragebait)) {
            analysisCache.set(text, result);
            injectWarningBadge(article, result);
            updateToxicStats();
            return;
          }
        } catch (err) {
          if (!err?.message?.includes('Extension context invalidated')) {
            console.warn('[FeedGuard Twitter] Background AI error:', err);
          }
        }
      }

      // Mark clean in cache so we don't re-analyze on re-scroll
      analysisCache.set(text, { toxic: false, ragebait: false, clickbait: false, reason: '' });
    });
  }

  /**
   * Sends a toxicBlocked increment to background, with direct storage fallback.
   */
  async function updateToxicStats() {
    let synced = false;
    try {
      const res = await safeSendMessage({
        type: 'UPDATE_STATS',
        payload: { toxicBlocked: 1 },
      });
      if (res && res.success) synced = true;
    } catch (_) {}

    if (!synced) {
      try {
        if (ext?.storage?.local) {
          const today = new Date().toISOString().split('T')[0];
          const { stats } = await ext.storage.local.get('stats');
          const current = stats && stats.date === today ? stats : {
            videosFiltered: 0,
            timeSpent: 0,
            toxicBlocked: 0,
            spamBlocked: 0,
            date: today,
          };
          current.toxicBlocked = (current.toxicBlocked || 0) + 1;
          await ext.storage.local.set({ stats: current });
        }
      } catch (_) {}
    }
  }

  /**
   * Sends a spamBlocked increment to background, with direct storage fallback.
   */
  async function updateSpamStats() {
    let synced = false;
    try {
      const res = await safeSendMessage({
        type: 'UPDATE_STATS',
        payload: { spamBlocked: 1 },
      });
      if (res && res.success) synced = true;
    } catch (_) {}

    if (!synced) {
      try {
        if (ext?.storage?.local) {
          const today = new Date().toISOString().split('T')[0];
          const { stats } = await ext.storage.local.get('stats');
          const current = stats && stats.date === today ? stats : {
            videosFiltered: 0,
            timeSpent: 0,
            toxicBlocked: 0,
            spamBlocked: 0,
            date: today,
          };
          current.spamBlocked = (current.spamBlocked || 0) + 1;
          await ext.storage.local.set({ stats: current });
        }
      } catch (_) {}
    }
  }

  // Feed Processing 

  /**
   * Scans the current DOM for unprocessed tweet articles and analyzes them.
   */
  function processTweets() {
    if (!settings.toxicFilter) return;

    const articles = document.querySelectorAll('article[data-testid="tweet"]');
    articles.forEach((article) => {
      analyzeTweet(article);
    });}
   //Watches for new tweets injected into the DOM (infinite scroll, navigation).
  //Debounce funtion 
  function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
  function startObserver() {
      const debouncedProcess = debounce(processTweets, 150);
    const observer = new MutationObserver((mutations) => {
      if (!isContextValid()) {
        observer.disconnect();
        return;
      }
      let hasNewNodes = false;
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          hasNewNodes = true;
          break;
        }
      }
      if (hasNewNodes) {
        // Debounce to avoid hammering on rapid mutations
        debouncedProcess();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  //Bootstrap

  /**
   * Initializes the Twitter content script.
   */
  async function init() {
    try {
      const response = await safeSendMessage({ type: 'GET_SETTINGS' });
      if (response && response.settings) {
        settings = response.settings;
      }
    } catch (err) {
      console.warn('[FeedGuard Twitter] Could not load settings:', err);
    }

    processTweets();
    startObserver();

    console.log('[FeedGuard AI] Twitter/X content script active. Settings:', settings);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
