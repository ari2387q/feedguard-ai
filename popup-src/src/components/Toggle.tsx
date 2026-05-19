import React from 'react';

/** Props for the Toggle component */
interface ToggleProps {
  /** Unique DOM id for the input (for accessibility) */
  id: string;
  /** Display label */
  label: string;
  /** Short description shown below the label */
  description: string;
  /** Emoji/icon prefix */
  icon: string;
  /** Current on/off state */
  enabled: boolean;
  /** Called when the user clicks the toggle */
  onToggle: () => void;
}

/**
 * Animated toggle switch with label, description, and icon.
 * Styled to match the dark FeedGuard popup theme.
 */
const Toggle: React.FC<ToggleProps> = ({
  id,
  label,
  description,
  icon,
  enabled,
  onToggle,
}) => {
  return (
    <div id={id} style={styles.row} onClick={onToggle} role="button" aria-pressed={enabled} tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); }}
    >
      {/* Icon + Text */}
      <div style={styles.left}>
        <span style={styles.icon}>{icon}</span>
        <div style={styles.textBlock}>
          <span style={styles.label}>{label}</span>
          <span style={styles.description}>{description}</span>
        </div>
      </div>

      {/* Toggle Switch */}
      <div style={{ ...styles.track, background: enabled ? 'var(--accent)' : 'var(--surface-2)' }}>
        <div
          style={{
            ...styles.thumb,
            transform: enabled ? 'translateX(18px)' : 'translateX(2px)',
            boxShadow: enabled ? '0 0 6px var(--accent-glow)' : 'none',
          }}
        />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '9px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    userSelect: 'none',
    outline: 'none',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  icon: {
    fontSize: 18,
    flexShrink: 0,
    width: 24,
    textAlign: 'center',
  },
  textBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text)',
    lineHeight: 1.3,
  },
  description: {
    fontSize: 11,
    color: 'var(--muted)',
    lineHeight: 1.3,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  track: {
    position: 'relative',
    width: 40,
    height: 22,
    borderRadius: 11,
    transition: 'background 0.2s ease',
    flexShrink: 0,
  },
  thumb: {
    position: 'absolute',
    top: 3,
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: '#fff',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
};

export default Toggle;
