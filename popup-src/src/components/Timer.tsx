import React from 'react';

/** Props for the Timer slider component */
interface TimerProps {
  /** Current time limit value in minutes (5–120) */
  value: number;
  /** Called with the new value when the slider changes */
  onChange: (value: number) => void;
}

const MIN = 5;
const MAX = 120;

/**
 * Horizontal range slider for setting the doomscroll time limit.
 * Displays the selected value with a human-readable label and
 * renders tick marks at key intervals.
 */
const Timer: React.FC<TimerProps> = ({ value, onChange }) => {
  /** Format minutes into a human-readable string */
  const formatTime = (mins: number): string => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
  };

  /** Percentage fill for the custom track gradient */
  const fillPct = ((value - MIN) / (MAX - MIN)) * 100;

  const ticks = [5, 15, 30, 60, 90, 120];

  return (
    <div style={styles.container}>
      {/* Value bubble */}
      <div style={styles.header}>
        <span style={styles.labelText}>Limit per session</span>
        <span style={styles.valueBadge}>{formatTime(value)}</span>
      </div>

      {/* Slider */}
      <div style={styles.sliderWrap}>
        <input
          id="timer-slider"
          type="range"
          min={MIN}
          max={MAX}
          step={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            ...styles.slider,
            background: `linear-gradient(to right, var(--accent) ${fillPct}%, var(--surface-2) ${fillPct}%)`,
          }}
          aria-label="Doomscroll time limit"
        />
      </div>

      {/* Tick labels */}
      <div style={styles.ticks}>
        {ticks.map((t) => (
          <span
            key={t}
            style={{
              ...styles.tick,
              color: value === t ? 'var(--accent)' : 'var(--muted)',
              fontWeight: value === t ? 700 : 400,
            }}
          >
            {t < 60 ? `${t}m` : `${t / 60}h`}
          </span>
        ))}
      </div>

      {/* Inline slider CSS injected once */}
      <style>{`
        #timer-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
          width: 100%;
        }
        #timer-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          box-shadow: 0 0 0 3px var(--accent-dim), 0 0 10px var(--accent-glow);
          transition: box-shadow 0.2s ease;
        }
        #timer-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 5px var(--accent-dim), 0 0 16px var(--accent-glow);
        }
        #timer-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 3px var(--accent-dim);
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '4px 2px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelText: {
    fontSize: 12,
    color: 'var(--muted)',
  },
  valueBadge: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--accent)',
    background: 'var(--accent-dim)',
    padding: '2px 10px',
    borderRadius: 20,
  },
  sliderWrap: {
    position: 'relative',
    padding: '4px 0',
  },
  slider: {
    width: '100%',
    cursor: 'pointer',
  },
  ticks: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  tick: {
    fontSize: 10,
    transition: 'color 0.15s, font-weight 0.15s',
  },
};

export default Timer;
