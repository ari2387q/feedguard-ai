
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
    'idiot', 'stupid', 'moron', 'pathetic', 'disgusting', 'trash', 'garbage',
   'kill yourself', 'kys', 'die', 'worthless',
  'clown', 'brain dead', 'degenerate',
  ];

  const RAGEBAIT_KEYWORDS = [
    'this is why',
    'unpopular opinion',
    'change my mind',
    'fight me',
    'they will never',
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
    'wait until you see',
    'this will blow your mind',
    'this is why i',
    'no one is talking about',
    'the truth about',
    'you need to know',
    'you need to hear',
    'here\'s why',
    'bet you didn\'t know',
  ];

  /*
   * Returns true if the text is likely toxic/rage-bait.
   * @param {string} text
   * @returns {{ likelyToxic: boolean, likelyRagebait: boolean }}
   */
  function quickHeuristicCheck(text) {
    if (!text) return { likelyToxic: false, likelyRagebait: false };
    const lower = text.toLowerCase();

    const likelyToxic = TOXIC_KEYWORDS.some((kw) => lower.includes(kw));
    const likelyRagebait = RAGEBAIT_KEYWORDS.some((kw) => lower.includes(kw));

    return { likelyToxic, likelyRagebait };
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
  // NEW - goes through background.js
async function checkSpam(text) {
    try {
        const result = await ext.runtime.sendMessage({
            type: 'CHECK_SPAM',
            payload: { text }
        });
        return result;
    } catch (err) {
        console.warn('[FeedGuard] Spam check failed:', err);
        return null;
    }
}
//To check the toxicity
async function checkToxic(text) {
  try {
    const result = await ext.runtime.sendMessage({
      type: 'CHECK_TOXIC',
      payload: { text }
    });
    return result;
  } catch (err) {
    console.warn('[FeedGuard] Toxic check failed:', err);
    return null;
  }
}
  // Tweet Analysis
  /**
   * Analyzes a single tweet element for toxic/rage-bait content.
   * Uses a local heuristic first; escalates to AI analysis if needed.
   * @param {Element} article - Tweet article DOM element
   */
  async function analyzeTweet(article) {
    if (processedTweets.has(article)) return;
    processedTweets.add(article);

    const textEl = article.querySelector('[data-testid="tweetText"]');
    if (!textEl) return;

    const text = textEl.textContent.trim();
    if (!text || text.length < 20) return;

    // Cache check
    if (analysisCache.has(text)) {
      const cached = analysisCache.get(text);
      if (cached.toxic || cached.ragebait) {
        injectWarningBadge(article, cached);
      }
      return;
    }

    // Quick local heuristic pass to avoid unnecessary API calls
    const { likelyToxic, likelyRagebait } = quickHeuristicCheck(text);
    const spamResult = settings.spamFilter ? await checkSpam(text) : null;
    if (spamResult && spamResult.label === 'SPAM') {
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
    if (!likelyToxic && !likelyRagebait) {
  analysisCache.set(text, { toxic: false, ragebait: false, clickbait: false, reason: '' });
  return;
}

// ML toxic check before escalating to Groq
const toxicResult = await checkToxic(text);
if (toxicResult && toxicResult.label === 'TOXIC') {
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

// Escalate to Groq LLM only if both ML models say clean

    // Escalate to AI analysis via background worker
    try {
      const result = await ext.runtime.sendMessage({
        type: 'ANALYZE_TWEET',
        payload: { text },
      });

      if (!result || result.error) {
        // Fallback: use heuristic result
        if (likelyToxic || likelyRagebait) {
          const fallback = {
            toxic: likelyToxic,
            ragebait: likelyRagebait,
            clickbait: false,
            reason: 'Heuristic detection (AI unavailable)',
          };
          analysisCache.set(text, fallback);
          injectWarningBadge(article, fallback);
          updateToxicStats();
        }
        return;
      }

      analysisCache.set(text, result);

      if (result.toxic || result.ragebait) {
        injectWarningBadge(article, result);
        updateToxicStats();
      }
    } catch (err) {
      console.warn('[FeedGuard Twitter] Analysis error:', err);
    }
  }

  /**
   * Sends a toxicBlocked increment to the background service worker.
   */
  function updateToxicStats() {
    ext.runtime.sendMessage({
      type: 'UPDATE_STATS',
      payload: { toxicBlocked: 1 },
    });
  }

  /**
   * Sends a spamBlocked increment to the background service worker.
   */
  function updateSpamStats() {
    ext.runtime.sendMessage({
      type: 'UPDATE_STATS',
      payload: { spamBlocked: 1 },
    });
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
      const response = await ext.runtime.sendMessage({ type: 'GET_SETTINGS' });
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
