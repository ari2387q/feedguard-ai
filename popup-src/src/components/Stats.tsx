import React from 'react';
import type { DailyStats } from '../App';

/** Props for the Stats component */
interface StatsProps {
  /** Today's aggregated usage statistics */
  stats: DailyStats;
}

/** A single stat tile configuration */
interface StatTile {
  icon: string;
  label: string;
  value: string;
  color: string;
  bg: string;
}

/**
 * Renders three stat cards showing today's:
 *  - Videos filtered (clickbait)
 *  - Time spent on feed (formatted)
 *  - Toxic content blocked
 */
const Stats: React.FC<StatsProps> = ({ stats }) => {
  /**
   * Formats a duration in seconds into a compact human-readable string.
   * @param seconds - Total seconds
   * @returns Formatted string like "4m 30s" or "1h 12m"
   */
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  };

  const tiles: StatTile[] = [
    {
      icon: '🚨',
      label: 'Filtered',
      value: String(stats.videosFiltered),
      color: '#f87171',
      bg: 'rgba(239,68,68,0.08)',
    },
    {
      icon: '⏱️',
      label: 'Time Spent',
      value: formatDuration(stats.timeSpent),
      color: '#818cf8',
      bg: 'rgba(99,102,241,0.08)',
    },
    {
      icon: '☣️',
      label: 'Toxic Blocked',
      value: String(stats.toxicBlocked),
      color: '#34d399',
      bg: 'rgba(52,211,153,0.08)',
    },
  ];

  return (
    <div style={styles.grid}>
      {tiles.map((tile) => (
        <div
          key={tile.label}
          style={{ ...styles.card, background: tile.bg, border: `1px solid ${tile.color}22` }}
          title={`${tile.label}: ${tile.value}`}
        >
          <span style={styles.tileIcon}>{tile.icon}</span>
          <span style={{ ...styles.tileValue, color: tile.color }}>{tile.value}</span>
          <span style={styles.tileLabel}>{tile.label}</span>
        </div>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    paddingTop: 4,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    padding: '10px 6px',
    borderRadius: 10,
    cursor: 'default',
    transition: 'transform 0.15s ease',
  },
  tileIcon: {
    fontSize: 18,
  },
  tileValue: {
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '-0.5px',
  },
  tileLabel: {
    fontSize: 10,
    color: 'var(--muted)',
    fontWeight: 500,
    textAlign: 'center' as const,
  },
};

export default Stats;
