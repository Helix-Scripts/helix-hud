import { memo, type ReactNode } from 'react';
import styles from './hud.module.css';

export type StatType = 'health' | 'armor' | 'hunger' | 'thirst' | 'stress';

interface StatBarProps {
  type: StatType;
  value: number; // 0–100
  icon: ReactNode;
}

const FILL_CLASS: Record<StatType, string> = {
  health: styles.fillHealth,
  armor: styles.fillArmor,
  hunger: styles.fillHunger,
  thirst: styles.fillThirst,
  stress: styles.fillStress,
};

const ICON_CLASS: Record<StatType, string> = {
  health: styles.iconHealth,
  armor: styles.iconArmor,
  hunger: styles.iconHunger,
  thirst: styles.iconThirst,
  stress: styles.iconStress,
};

function isCritical(type: StatType, value: number): boolean {
  if (type === 'stress') return value > 75;
  return value < 25;
}

function isStressHigh(type: StatType, value: number): boolean {
  return type === 'stress' && value > 75;
}

export const StatBar = memo(function StatBar({ type, value, icon }: StatBarProps) {
  const pct = Math.min(Math.max(value, 0), 100);
  const critical = isCritical(type, value);
  const stressHigh = isStressHigh(type, value);

  const fillClasses = [
    styles.statBarFill,
    FILL_CLASS[type],
    critical ? styles.fillCritical : '',
    stressHigh ? styles.fillStressHigh : '',
  ].filter(Boolean).join(' ');

  const iconClasses = [
    styles.statIcon,
    ICON_CLASS[type],
    critical ? styles.iconCritical : '',
  ].filter(Boolean).join(' ');

  const trackClasses = [
    styles.statBarTrack,
    critical ? styles.trackCritical : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.stat}>
      <span className={iconClasses}>{icon}</span>
      <div className={trackClasses}>
        <div
          className={fillClasses}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={styles.statValue}>{Math.round(value)}%</span>
    </div>
  );
});
