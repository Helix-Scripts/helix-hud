import { useEffect, useRef, memo } from 'react';
import styles from './hud.module.css';

interface SpeedReadoutProps {
  speed: number;
  unit: 'kmh' | 'mph';
}

const FLASH_DELTA = 10;

export const SpeedReadout = memo(function SpeedReadout({ speed, unit }: SpeedReadoutProps) {
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
      <span className={styles.speedUnit}>
        {unit === 'mph' ? 'MPH' : 'KM/H'}
      </span>
    </div>
  );
});
