import { memo, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import styles from '../styles/hud.module.css';

interface BarColor {
  gradientStart: string;
  gradientEnd: string;
  glow: string;
  iconColor: string;
}

interface StatusBarProps {
  label: string;
  value: number;
  colors: BarColor;
  Icon: LucideIcon;
}

function StatusBarComponent({ label, value, colors, Icon }: StatusBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const isCritical = clampedValue <= 20;

  const fillStyle = useMemo(
    () => ({
      width: `${clampedValue}%`,
      background: `linear-gradient(90deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
      boxShadow: `0 0 8px ${colors.glow}`,
    }),
    [clampedValue, colors],
  );

  return (
    <div className={styles.statusBar} title={`${label}: ${clampedValue}%`}>
      <span className={styles.statusIcon}>
        <Icon size={13} strokeWidth={1.75} color={colors.iconColor} />
      </span>
      <div className={styles.barTrack}>
        <div
          className={`${styles.barFill} ${isCritical ? styles.barCritical : ''}`}
          style={fillStyle}
        />
      </div>
    </div>
  );
}

export const StatusBar = memo(StatusBarComponent);
