import { memo } from 'react';
import { Fuel } from 'lucide-react';
import styles from './hud.module.css';

interface FuelBarProps {
  fuel: number; // 0–100
}

const LOW_THRESHOLD = 15;

export const FuelBar = memo(function FuelBar({ fuel }: FuelBarProps) {
  const pct = Math.min(Math.max(fuel, 0), 100);
  const isLow = fuel < LOW_THRESHOLD;

  return (
    <div className={styles.fuelBar}>
      <span className={styles.fuelIcon}>
        <Fuel size={9} />
      </span>
      <div className={styles.fuelTrack}>
        <div
          className={`${styles.fuelFill} ${isLow ? styles.fuelLow : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`${styles.fuelValue} ${isLow ? styles.fuelValueLow : ''}`}>
        {Math.round(fuel)}
      </span>
    </div>
  );
});
