import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { VehicleData } from '../types';
import { Fuel, Cog, Siren } from 'lucide-react';
import styles from '../styles/hud.module.css';

interface VehicleHudProps {
  data: VehicleData;
  showSeatbelt: boolean;
}

function VehicleHudComponent({ data, showSeatbelt }: VehicleHudProps) {
  const [shouldRender, setShouldRender] = useState(data.active);
  const [animClass, setAnimClass] = useState(
    data.active ? styles.vehicleSlideIn : '',
  );
  const prevActive = useRef(data.active);

  useEffect(() => {
    if (data.active && !prevActive.current) {
      // Vehicle became active — slide in
      setShouldRender(true);
      setAnimClass(styles.vehicleSlideIn);
    } else if (!data.active && prevActive.current) {
      // Vehicle became inactive — slide out, then unmount
      setAnimClass(styles.vehicleSlideOut);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
    prevActive.current = data.active;
  }, [data.active]);

  const fuelStyle = useMemo(
    () => ({
      width: `${Math.max(0, Math.min(100, data.fuel))}%`,
    }),
    [data.fuel],
  );

  if (!shouldRender) return null;

  const unitLabel = data.speedUnit === 'mph' ? 'MPH' : 'KM/H';

  return (
    <div className={`${styles.vehicleHud} ${animClass}`}>
      <div className={styles.vehicleSpeed}>
        <span className={styles.speedValue}>{data.speed}</span>
        <span className={styles.speedUnit}>{unitLabel}</span>
      </div>

      <div className={styles.vehicleRow}>
        <div className={styles.fuelContainer}>
          <span className={styles.fuelIcon}>
            <Fuel size={13} strokeWidth={1.75} />
          </span>
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
            <Cog size={13} strokeWidth={1.75} />
          </span>
          {showSeatbelt && (
            <span
              className={`${styles.indicator} ${data.seatbelt ? styles.seatbeltActive : styles.indicatorWarning}`}
              title="Seatbelt"
            >
              <Siren size={13} strokeWidth={1.75} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export const VehicleHud = memo(VehicleHudComponent);
