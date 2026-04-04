import { useEffect, useRef, memo } from 'react';
import styles from './hud.module.css';

interface SpeedReadoutProps {
  speed: number;
  gear: number; // -1=R, 0=N, 1-6=forward
  unit: 'kmh' | 'mph';
}

function formatGear(gear: number): string {
  if (gear === -1) return 'R';
  if (gear === 0) return 'N';
  return String(gear);
}

const FLASH_DELTA = 10;

export const SpeedReadout = memo(function SpeedReadout({ speed, gear, unit }: SpeedReadoutProps) {
  const prevSpeed = useRef(speed);
  const valueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delta = Math.abs(speed - prevSpeed.current);
    if (delta >= FLASH_DELTA && valueRef.current) {
      valueRef.current.classList.add(styles.speedFlash);
      const el = valueRef.current;
      const handler = () => el.classList.remove(styles.speedFlash);
      el.addEventListener('animationend', handler, { once: true });
    }
    prevSpeed.current = speed;
  }, [speed]);

  return (
    <div className={styles.speedRow}>
      <div ref={valueRef} className={styles.speedValue}>
        {speed}
      </div>
      <div className={styles.speedMeta}>
        <span className={`${styles.gearInline} ${gear === 0 ? styles.gearNeutral : ''}`}>
          {formatGear(gear)}
        </span>
        <span className={styles.speedUnit}>
          {unit === 'mph' ? 'MPH' : 'KM/H'}
        </span>
      </div>
    </div>
  );
});
