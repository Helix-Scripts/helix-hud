import { memo, useMemo } from 'react';
import { Heart, Shield, Utensils, Droplets, Zap } from 'lucide-react';
import { StatBar } from './StatBar';
import styles from './hud.module.css';
import type { HudState } from '../../types';

interface StatBarsProps {
  state: HudState;
  position: { bottom: number; left: number };
  autoHide: boolean;
  showValues: boolean;
}

export const StatBars = memo(function StatBars({
  state,
  position,
  autoHide,
  showValues,
}: StatBarsProps) {
  const { health, armor, hunger, thirst, stress } = state;

  // Auto-hide: all stats above 80% → dim. Any below 50% → alert.
  const allGood = health > 80 && armor > 80 && hunger > 80 && thirst > 80 && stress < 20;
  const anyAlert = health < 50 || hunger < 50 || thirst < 50 || stress > 50;

  const containerClasses = useMemo(() => {
    const cls = [styles.statBars];
    if (autoHide && allGood) cls.push(styles.statBarsAutoHide);
    if (autoHide && anyAlert) cls.push(styles.statBarsAlert);
    if (showValues) cls.push(styles.statBarsShowValues);
    return cls.join(' ');
  }, [autoHide, allGood, anyAlert, showValues]);

  return (
    <div
      className={containerClasses}
      style={{ bottom: position.bottom, left: position.left }}
    >
      <StatBar type="health" value={health} icon={<Heart size={12} fill="currentColor" />} />
      {armor > 0 && (
        <StatBar type="armor" value={armor} icon={<Shield size={12} />} />
      )}
      <StatBar type="hunger" value={hunger} icon={<Utensils size={12} />} />
      <StatBar type="thirst" value={thirst} icon={<Droplets size={12} />} />
      <StatBar type="stress" value={stress} icon={<Zap size={12} />} />
    </div>
  );
});
