import React, { useEffect, useState, useCallback } from 'react';
import Toggle from './components/Toggle';
import Timer from './components/Timer';
import Stats from './components/Stats';

/** Shape of persisted settings stored in chrome.storage.sync */
export interface Settings {
  clickbaitFilter: boolean;
  doomscrollTimer: boolean;
  aiSummarize: boolean;
  toxicFilter: boolean;
  timeLimit: number; // minutes
}

/** Shape of daily statistics stored in chrome.storage.local */
export interface DailyStats {
  videosFiltered: number;
  timeSpent: number;  // seconds
  toxicBlocked: number;
  date: string;
}

const DEFAULT_SETTINGS: Settings = {
  clickbaitFilter: true,
  doomscrollTimer: true,
  aiSummarize: true,
  toxicFilter: true,
  timeLimit: 30,
};

const DEFAULT_STATS: DailyStats = {
  videosFiltered: 0,
  timeSpent: 0,
  toxicBlocked: 0,
  date: new Date().toISOString().split('T')[0],
};

/**
 * Root popup component.
 * Loads settings and stats from chrome.storage, renders controls,
 * and persists any changes back to storage.
 */
const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<DailyStats>(DEFAULT_STATS);
  const [userId, setUserId] = useState<string>('demo');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // ─── Load from storage on mount ──────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const syncData = await chrome.storage.sync.get('settings');
        if (syncData.settings) setSettings(syncData.settings as Settings);

        const localData = await chrome.storage.local.get(['stats', 'userId']);
        if (localData.stats) setStats(localData.stats as DailyStats);
        if (localData.userId) setUserId(localData.userId as string);
      } catch (err) {
        console.error('[FeedGuard Popup] Failed to load storage:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ─── Persist settings on change ──────────────────────────────────────────────
  const persistSettings = useCallback(async (next: Settings) => {
    try {
      await chrome.storage.sync.set({ settings: next });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      console.error('[FeedGuard Popup] Failed to save settings:', err);
    }
  }, []);

  /**
   * Toggles a boolean setting field and persists.
   * @param key - The settings key to toggle
   */
  const handleToggle = (key: keyof Omit<Settings, 'timeLimit'>) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    persistSettings(next);
  };

  /**
   * Updates the time limit value and persists.
   * @param value - New time limit in minutes
   */
  const handleTimeLimitChange = (value: number) => {
    const next = { ...settings, timeLimit: value };
    setSettings(next);
    persistSettings(next);
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>Loading…</span>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🛡️</span>
          <div>
            <div style={styles.logoName}>FeedGuard AI</div>
            <div style={styles.logoSub}>Feed Curator</div>
          </div>
        </div>
        {saved && <span style={styles.savedBadge}>✓ Saved</span>}
      </header>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Toggle Controls */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>FILTERS</div>

        <Toggle
          id="toggle-clickbait"
          label="Clickbait Filter"
          description="Hides misleading video titles"
          icon="🚨"
          enabled={settings.clickbaitFilter}
          onToggle={() => handleToggle('clickbaitFilter')}
        />
        <Toggle
          id="toggle-doomscroll"
          label="Doomscroll Timer"
          description="Limits feed browsing time"
          icon="⏱️"
          enabled={settings.doomscrollTimer}
          onToggle={() => handleToggle('doomscrollTimer')}
        />
        <Toggle
          id="toggle-summarize"
          label="AI Summarize"
          description="Shows summary on video hover"
          icon="🤖"
          enabled={settings.aiSummarize}
          onToggle={() => handleToggle('aiSummarize')}
        />
        <Toggle
          id="toggle-toxic"
          label="Toxic Content Filter"
          description="Flags rage bait & toxic tweets"
          icon="☣️"
          enabled={settings.toxicFilter}
          onToggle={() => handleToggle('toxicFilter')}
        />
      </section>

      <div style={styles.divider} />

      {/* Timer Slider */}
      {settings.doomscrollTimer && (
        <>
          <section style={styles.section}>
            <div style={styles.sectionTitle}>TIME LIMIT</div>
            <Timer
              value={settings.timeLimit}
              onChange={handleTimeLimitChange}
            />
          </section>
          <div style={styles.divider} />
        </>
      )}

      {/* Stats */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>TODAY'S STATS</div>
        <Stats stats={stats} />
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <a
          href={`https://feedguard-ai-dashboard.vercel.app/?userId=${userId}`}
          target="_blank"
          rel="noreferrer"
          style={styles.dashboardLink}
        >
          Open Dashboard →
        </a>
      </footer>
    </div>
  );
};

// ─── Inline Styles ────────────────────────────────────────────────────────────
/** Using inline styles to avoid CSS module complexity in a single-file popup */
const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    width: 340,
    minHeight: 480,
    background: 'var(--bg)',
    overflow: 'hidden',
  },
  loadingContainer: {
    width: 340,
    height: 480,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    background: 'var(--bg)',
  },
  spinner: {
    width: 24,
    height: 24,
    border: '2px solid var(--border)',
    borderTop: '2px solid var(--accent)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px 12px',
    background: 'var(--surface)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    fontSize: 28,
  },
  logoName: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text)',
    letterSpacing: '-0.3px',
  },
  logoSub: {
    fontSize: 10,
    color: 'var(--accent)',
    fontWeight: 500,
    letterSpacing: '0.8px',
    textTransform: 'uppercase' as const,
  },
  savedBadge: {
    fontSize: 11,
    color: 'var(--success)',
    background: 'rgba(34,197,94,0.12)',
    padding: '3px 9px',
    borderRadius: 20,
    fontWeight: 600,
  },
  divider: {
    height: 1,
    background: 'var(--border)',
  },
  section: {
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--muted)',
    letterSpacing: '1px',
    marginBottom: 6,
  },
  footer: {
    padding: '10px 16px',
    display: 'flex',
    justifyContent: 'flex-end',
    borderTop: '1px solid var(--border)',
    marginTop: 'auto',
  },
  dashboardLink: {
    color: 'var(--accent)',
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: 500,
  },
};

export default App;
