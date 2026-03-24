import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Sun, AlertTriangle, Lightbulb, Fuel } from 'lucide-react';
import type { VehicleData } from '../types';
import styles from '../styles/hud.module.css';

interface VehiclePanelProps {
  data: VehicleData;
  showSeatbelt: boolean;
}

function VehiclePanelComponent({ data, showSeatbelt }: VehiclePanelProps) {
  const [shouldRender, setShouldRender] = useState(data.active);
  const [animClass, setAnimClass] = useState(
    data.active ? styles.vehicleSlideIn : '',
  );
  const prevActive = useRef(data.active);

  useEffect(() => {
    if (data.active && !prevActive.current) {
      setShouldRender(true);
      setAnimClass(styles.vehicleSlideIn);
    } else if (!data.active && prevActive.current) {
      setAnimClass(styles.vehicleSlideOut);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
    prevActive.current = data.active;
  }, [data.active]);

  const fuelClamped = Math.max(0, Math.min(100, data.fuel));
  const rpmClamped = Math.max(0, Math.min(100, data.rpm));
  const unitLabel = data.speedUnit === 'mph' ? 'mph' : 'km/h';

  const fuelStyle = useMemo(() => ({ height: `${fuelClamped}%` }), [fuelClamped]);
  const rpmStyle = useMemo(() => ({ width: `${rpmClamped}%` }), [rpmClamped]);

  if (!shouldRender) return null;

  return (
    <div className={styles.hudRight}>
      <div
        className={`${styles.panel} ${styles.vehiclePanel} ${animClass}`}
      >
        <div className={styles.clusterLabel}>Vehicle</div>
        <div className={styles.vehicleContent}>
          {/* Speed + RPM + Indicators column */}
          <div className={styles.speedColumn}>
            <div className={styles.speedDisplay}>
              <span className={styles.speedValue}>{data.speed}</span>
              <span className={styles.speedUnit}>{unitLabel}</span>
            </div>

            {/* RPM Bar */}
            <div className={styles.rpmBar}>
              <span className={styles.rpmLabel}>RPM</span>
              <div className={styles.rpmTrack}>
                <div className={styles.rpmFill} style={rpmStyle} />
              </div>
            </div>

            {/* Indicators */}
            <div className={styles.indicatorRow}>
              {/* Engine */}
              <div
                className={`${styles.indicator} ${
                  data.engine ? styles.indicatorActive : styles.indicatorOff
                }`}
                title="Engine"
              >
                <Sun size={11} strokeWidth={1.75} />
              </div>

              {/* Seatbelt */}
              {showSeatbelt && (
                <div
                  className={`${styles.indicator} ${
                    data.seatbelt
                      ? styles.indicatorOff
                      : styles.indicatorWarning
                  }`}
                  title="Seatbelt"
                >
                  <AlertTriangle size={11} strokeWidth={1.75} />
                </div>
              )}

              {/* Lights */}
              <div
                className={`${styles.indicator} ${
                  data.lightsOn ? styles.indicatorActive : styles.indicatorOff
                }`}
                title="Lights"
              >
                <Lightbulb size={11} strokeWidth={1.75} />
              </div>
            </div>
          </div>

          {/* Fuel Tube */}
          <div className={styles.vehicleSide}>
            <div className={styles.fuelTubeContainer}>
              <div className={styles.fuelTubeFill} style={fuelStyle} />
            </div>
            <div className={styles.fuelIcon}>
              <Fuel size={10} strokeWidth={1.75} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const VehiclePanel = memo(VehiclePanelComponent);
