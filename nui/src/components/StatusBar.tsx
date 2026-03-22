import { memo, useMemo } from 'react';
import type { ReactNode } from 'react';
import styles from '../styles/hud.module.css';

interface BarColor {
  gradient: string;
  glow: string;
  iconColor: string;
}

interface StatusBarProps {
  label: string;
  value: number;
  colors: BarColor;
  icon?: ReactNode;
}

function StatusBarComponent({ label, value, colors, icon }: StatusBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const isCritical = clampedValue <= 20;

  const fillStyle = useMemo(
    () => ({
      width: `${clampedValue}%`,
      background: colors.gradient,
      boxShadow: colors.glow,
    }),
    [clampedValue, colors.gradient, colors.glow],
  );

  return (
    <div className={styles.statusBar} title={`${label}: ${clampedValue}%`}>
      {icon && (
        <span className={styles.statusIcon} style={{ color: colors.iconColor }}>
          {icon}
        </span>
      )}
      <div className={styles.barTrack}>
        <div
          className={`${styles.barFill} ${isCritical ? styles.barFillCritical : ''}`}
          style={fillStyle}
        />
      </div>
    </div>
  );
}

export const StatusBar = memo(StatusBarComponent);
