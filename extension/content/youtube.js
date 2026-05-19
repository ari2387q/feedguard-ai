/**
 * FeedGuard AI — YouTube Content Script
 * Plain JavaScript (no imports/TypeScript) — runs directly in the YouTube page context.
 *
 * Features:
 *  - Doomscroll timer with visual overlay when limit is exceeded
 *  - Clickbait scorer based on title heuristics (ALL CAPS, keywords, punctuation)
 *  - Clickbait badge on video cards
 *  - On-hover tooltip calling backend /api/summarize via background worker
 *  - MutationObserver to handle YouTube's dynamic SPA navigation
 */

(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────────────────────

  /** @type {{ clickbaitFilter: boolean, doomscrollTimer: boolean, aiSummarize: boolean, toxicFilter: boolean, timeLimit: number }} */
  let settings = {
    clickbaitFilter: true,
    doomscrollTimer: true,
    aiSummarize: true,
    toxicFilter: true,
    timeLimit: 30,
  };

  let timeSpentSeconds = 0;
  let doomscrollInterval = null;
  let overlayVisible = false;
  let sessionStartTime = Date.now();

  /** @type {Set<string>} Tracks video IDs already processed to avoid duplication */
  const processedVideoIds = new Set();

  /** @type {Map<Element, boolean>} Tracks hover-tooltip state per element */
  const tooltipElements = new Map();

  // ─── Clickbait Detection Heuristics ─────────────────────────────────────────

  const CLICKBAIT_KEYWORDS = [
    'you won\'t believe', 'shocking', 'insane', 'crazy', 'mind blowing',
    'gone wrong', 'gone sexual', 'emotional', 'reaction', '**gone wild**',
    'must watch', 'watch before deleted', 'exposed', 'secret revealed',
    'they don\'t want you to know', 'truth about', 'this changes everything',
    '100%', 'not clickbait', 'gone wrong', 'prank', 'challenge',
    'i quit', 'breaking news', 'urgent', 'important announcement',
    'subscribers only', 'never seen before', 'first ever',
  ];

  /**
   * Calculates a clickbait score (0–100) for a given video title.
   * @param {string} title - Raw video title text
   * @returns {{ score: number, reasons: string[] }}
   */
  function scoreClickbait(title) {
    if (!title) return { score: 0, reasons: [] };

    const lower = title.toLowerCase();
    const reasons = [];
    let score = 0;

    // ALL CAPS ratio
    const capsRatio = (title.match(/[A-Z]/g) || []).length / title.length;
    if (capsRatio > 0.5) {
      score += 25;
      reasons.push('Excessive caps');
    }

    // Excessive punctuation (!! ?? !!!)
    if (/[!?]{2,}/.test(title)) {
      score += 15;
      reasons.push('Excessive punctuation');
    }

    // Clickbait keyword matching
    for (const kw of CLICKBAIT_KEYWORDS) {
      if (lower.includes(kw)) {
        score += 20;
        reasons.push(`Contains "${kw}"`);
        break; // One keyword is enough for this tier
      }
    }

    // Numeric exaggeration (e.g. "100 ways", "1000 subscribers")
    if (/\b\d{4,}\b/.test(title)) {
      score += 10;
      reasons.push('Large numbers for engagement');
    }

    // Emoji bait
    const emojiCount = (title.match(/[\u{1F300}-\u{1FFFF}]/gu) || []).length;
    if (emojiCount > 2) {
      score += 10;
      reasons.push('Emoji overload');
    }

    return { score: Math.min(score, 100), reasons };
  }

  // ─── DOM Helpers ─────────────────────────────────────────────────────────────

  /**
   * Creates and injects a clickbait badge element into a video card.
   * @param {Element} card - The ytd-rich-item-renderer or ytd-compact-video-renderer element
   * @param {number} score - Clickbait score (0–100)
   * @param {string[]} reasons - Array of reason strings
   */
  function injectClickbaitBadge(card, score, reasons) {
    if (card.querySelector('.fg-clickbait-badge')) return;

    const badge = document.createElement('div');
    badge.className = 'fg-clickbait-badge';
    badge.title = reasons.join(' | ');
    badge.style.cssText = `
      position: absolute;
      top: 6px;
      left: 6px;
      background: ${score > 60 ? '#ef4444' : '#f59e0b'};
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      z-index: 9999;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      letter-spacing: 0.5px;
    `;
    badge.textContent = score > 60 ? '🚨 Clickbait' : '⚠️ Likely Bait';

    const thumbnail = card.querySelector('ytd-thumbnail, #thumbnail');
    if (thumbnail) {
      thumbnail.style.position = 'relative';
      thumbnail.appendChild(badge);
    }
  }

  /**
   * Injects a blur overlay on a video card for high clickbait scores.
   * @param {Element} card
   * @param {number} score
   */
  function applyBlurToCard(card, score) {
    if (score < 70) return;
    if (card.querySelector('.fg-blur-overlay')) return;

    const thumbnail = card.querySelector('ytd-thumbnail, #thumbnail');
    if (!thumbnail) return;

    thumbnail.style.position = 'relative';

    const blur = document.createElement('div');
    blur.className = 'fg-blur-overlay';
    blur.style.cssText = `
      position: absolute;
      inset: 0;
      backdrop-filter: blur(8px);
      background: rgba(0,0,0,0.3);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 6px;
    `;

    const label = document.createElement('span');
    label.textContent = '🛡 Filtered';
    label.style.cssText = `
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      background: rgba(0,0,0,0.6);
      padding: 4px 10px;
      border-radius: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    blur.appendChild(label);

    blur.addEventListener('click', () => blur.remove());
    thumbnail.appendChild(blur);
  }

  /**
   * Creates an AI summary tooltip element.
   * @returns {HTMLElement}
   */
  function createTooltip() {
    const tip = document.createElement('div');
    tip.className = 'fg-summary-tooltip';
    tip.style.cssText = `
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: #1a1a2e;
      border: 1px solid #6366f1;
      color: #e2e8f0;
      font-size: 12px;
      line-height: 1.5;
      padding: 10px 14px;
      border-radius: 8px;
      z-index: 99999;
      max-width: 280px;
      min-width: 180px;
      box-shadow: 0 8px 32px rgba(99,102,241,0.25);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      pointer-events: none;
      transition: opacity 0.2s ease;
    `;
    return tip;
  }

  /**
   * Attaches hover-based AI summary tooltip to a video card.
   * @param {Element} card
   * @param {string} title
   */
  function attachSummaryTooltip(card, title) {
    if (tooltipElements.has(card)) return;
    tooltipElements.set(card, false);

    const thumbnail = card.querySelector('ytd-thumbnail, #thumbnail');
    if (!thumbnail) return;

    thumbnail.style.position = 'relative';

    let tooltip = null;
    let hoverTimer = null;

    thumbnail.addEventListener('mouseenter', () => {
      if (!settings.aiSummarize) return;

      hoverTimer = setTimeout(async () => {
        if (!tooltip) {
          tooltip = createTooltip();
          tooltip.textContent = '⏳ Loading AI summary…';
          thumbnail.appendChild(tooltip);
        }

        try {
          const response = await chrome.runtime.sendMessage({
            type: 'SUMMARIZE',
            payload: { title, description: '' },
          });

          if (response && response.summary) {
            tooltip.innerHTML = `<strong style="color:#818cf8">🤖 AI Summary</strong><br>${response.summary}`;
          } else {
            tooltip.textContent = '⚠️ Summary unavailable';
          }
        } catch {
          tooltip.textContent = '⚠️ Backend not reachable';
        }
      }, 600);
    });

    thumbnail.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }
    });
  }

  // ─── Doomscroll Timer ─────────────────────────────────────────────────────────

  /**
   * Creates and injects the doomscroll warning overlay into the document body.
   */
  function showDoomscrollOverlay() {
    if (overlayVisible) return;
    overlayVisible = true;

    const overlay = document.createElement('div');
    overlay.id = 'fg-doomscroll-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.88);
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #fff;
      gap: 20px;
      backdrop-filter: blur(6px);
    `;

    overlay.innerHTML = `
      <div style="font-size: 56px;">🛡️</div>
      <h2 style="margin:0; font-size: 28px; font-weight: 700; color: #818cf8;">Time Limit Reached</h2>
      <p style="margin:0; font-size: 16px; color: #94a3b8; text-align:center; max-width: 360px;">
        You've been on YouTube for <strong style="color:#6366f1">${Math.round(timeSpentSeconds / 60)} minutes</strong>.<br>
        Take a break — your future self will thank you.
      </p>
      <div style="display:flex; gap: 12px; margin-top: 8px;">
        <button id="fg-snooze-btn" style="
          background: #6366f1; color: #fff; border: none; padding: 10px 24px;
          border-radius: 8px; font-size: 15px; cursor: pointer; font-weight: 600;
        ">Snooze 10 min</button>
        <button id="fg-dismiss-btn" style="
          background: transparent; color: #64748b; border: 1px solid #334155;
          padding: 10px 24px; border-radius: 8px; font-size: 15px; cursor: pointer;
        ">Dismiss</button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('fg-dismiss-btn').addEventListener('click', () => {
      overlay.remove();
      overlayVisible = false;
    });

    document.getElementById('fg-snooze-btn').addEventListener('click', () => {
      timeSpentSeconds = 0;
      overlay.remove();
      overlayVisible = false;
    });
  }

  /**
   * Starts or restarts the doomscroll timer interval.
   */
  function startDoomscrollTimer() {
    if (doomscrollInterval) clearInterval(doomscrollInterval);

    doomscrollInterval = setInterval(() => {
      if (!settings.doomscrollTimer) return;
      if (document.hidden) return;

      timeSpentSeconds += 5;

      const limitSeconds = settings.timeLimit * 60;
      if (timeSpentSeconds >= limitSeconds && !overlayVisible) {
        showDoomscrollOverlay();

        // Report time spent to background
        chrome.runtime.sendMessage({
          type: 'UPDATE_STATS',
          payload: { timeSpent: 5 },
        });
      }
    }, 5000);
  }

  // ─── Feed Processing ──────────────────────────────────────────────────────────

  /**
   * Processes all video cards currently in the DOM.
   */
  function processVideoCards() {
    const selectors = [
      'ytd-rich-item-renderer',
      'ytd-compact-video-renderer',
      'ytd-video-renderer',
    ];

    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((card) => {
        const titleEl = card.querySelector('#video-title, .title');
        if (!titleEl) return;

        const title = titleEl.textContent.trim();
        const videoId = card.dataset.fgId;

        // Generate a stable key from title text
        const key = title.slice(0, 60);
        if (processedVideoIds.has(key)) return;
        processedVideoIds.add(key);

        card.dataset.fgId = key;

        // Clickbait scoring
        if (settings.clickbaitFilter) {
          const { score, reasons } = scoreClickbait(title);
          if (score >= 30) {
            injectClickbaitBadge(card, score, reasons);
            applyBlurToCard(card, score);

            if (score >= 60) {
              chrome.runtime.sendMessage({
                type: 'UPDATE_STATS',
                payload: { videosFiltered: 1 },
              });
            }
          }
        }

        // AI Summarize tooltip
        if (settings.aiSummarize) {
          attachSummaryTooltip(card, title);
        }
      });
    });
  }

  // ─── MutationObserver ─────────────────────────────────────────────────────────

  /**
   * Watches for DOM changes (YouTube SPA navigation / lazy-loaded cards)
   * and re-runs processVideoCards on relevant mutations.
   */
  function startObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          shouldProcess = true;
          break;
        }
      }
      if (shouldProcess) {
        requestAnimationFrame(processVideoCards);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ─── Bootstrap ───────────────────────────────────────────────────────────────

  /**
   * Initializes the content script by loading settings and starting all features.
   */
  async function init() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (response && response.settings) {
        settings = response.settings;
      }
    } catch (err) {
      console.warn('[FeedGuard YouTube] Could not load settings:', err);
    }

    startDoomscrollTimer();
    processVideoCards();
    startObserver();

    console.log('[FeedGuard AI] YouTube content script active. Settings:', settings);
  }

  // Wait for the document to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
