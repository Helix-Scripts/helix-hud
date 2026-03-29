import { memo } from 'react';
import styles from './hud.module.css';

interface RpmBarProps {
  rpm: number; // 0.0–1.0
}

export const RpmBar = memo(function RpmBar({ rpm }: RpmBarProps) {
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
    </div>
  );
});
