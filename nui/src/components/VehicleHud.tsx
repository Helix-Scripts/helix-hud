import { memo, useMemo } from 'react';
import type { VehicleData } from '../types';
import styles from '../styles/hud.module.css';

interface VehicleHudProps {
  data: VehicleData;
  showSeatbelt: boolean;
}

function VehicleHudComponent({ data, showSeatbelt }: VehicleHudProps) {
  const fuelStyle = useMemo(
    () => ({
      width: `${Math.max(0, Math.min(100, data.fuel))}%`,
    }),
    [data.fuel],
  );

  if (!data.active) return null;

  const unitLabel = data.speedUnit === 'mph' ? 'MPH' : 'KM/H';

  return (
    <div className={`${styles.vehicleHud} ${styles.vehicleSlideIn}`}>
      <div className={styles.vehicleSpeed}>
        <span className={styles.speedValue}>{data.speed}</span>
        <span className={styles.speedUnit}>{unitLabel}</span>
      </div>

      <div className={styles.vehicleRow}>
        <div className={styles.fuelContainer}>
          <span className={styles.fuelIcon}>⛽</span>
          <div className={styles.fuelTrack}>
            <div
              className={`${styles.fuelFill} ${data.fuel <= 15 ? styles.fuelLow : ''}`}
              style={fuelStyle}
            />
          </div>
        </div>

        <div className={styles.vehicleIndicators}>
          <span
            className={`${styles.indicator} ${data.engine ? styles.indicatorActive : styles.indicatorOff}`}
            title="Engine"
          >
            ⚙
          </span>
          {showSeatbelt && (
            <span
              className={`${styles.indicator} ${data.seatbelt ? styles.indicatorActive : styles.indicatorWarning}`}
              title="Seatbelt"
            >
              🔒
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export const VehicleHud = memo(VehicleHudComponent);
