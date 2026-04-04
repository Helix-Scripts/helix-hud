import { memo } from 'react';
import styles from './hud.module.css';

interface RpmBarProps {
  rpm: number; // 0.0–1.0
  gear: number; // -1=R, 0=N, 1-6=forward
}

function formatGear(gear: number): string {
  if (gear === -1) return 'R';
  if (gear === 0) return 'N';
  return String(gear);
}

export const RpmBar = memo(function RpmBar({ rpm, gear }: RpmBarProps) {
  const pct = Math.min(Math.max(rpm * 100, 0), 100);
  const isRedline = rpm > 0.85;

  return (
    <div className={styles.rpmBar}>
      <span className={styles.rpmLabel}>RPM</span>
      <div className={styles.rpmTrack}>
        <div
          className={`${styles.rpmFill} ${isRedline ? styles.rpmRedline : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`${styles.rpmGear} ${gear === 0 ? styles.rpmGearNeutral : ''}`}>
        {formatGear(gear)}
      </span>
    </div>
  );
});
