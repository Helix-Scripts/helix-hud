import { memo } from 'react';
import styles from './hud.module.css';

interface GearIndicatorProps {
  gear: number; // -1=R, 0=N, 1-6=forward
  visible: boolean;
  position: { bottom: number; right: number };
}

function formatGear(gear: number): string {
  if (gear === -1) return 'R';
  if (gear === 0) return 'N';
  return String(gear);
}

export const GearIndicator = memo(function GearIndicator({ gear, visible, position }: GearIndicatorProps) {
  const isNeutral = gear === 0;

  return (
    <div
      className={`${styles.gear} ${!visible ? styles.gearHidden : ''}`}
      style={{ bottom: position.bottom, right: position.right }}
    >
      <span className={`${styles.gearValue} ${isNeutral ? styles.gearNeutral : ''}`}>
        {formatGear(gear)}
      </span>
    </div>
  );
});
