import { memo, useMemo } from 'react';
import styles from '../styles/hud.module.css';

interface StatusBarProps {
  label: string;
  value: number;
  color: string;
  icon?: string;
}

function StatusBarComponent({ label, value, color, icon }: StatusBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  const fillStyle = useMemo(
    () => ({
      width: `${clampedValue}%`,
      backgroundColor: color,
    }),
    [clampedValue, color],
  );

  return (
    <div className={styles.statusBar} title={`${label}: ${clampedValue}%`}>
      {icon && <span className={styles.statusIcon}>{icon}</span>}
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={fillStyle} />
      </div>
    </div>
  );
}

export const StatusBar = memo(StatusBarComponent);
