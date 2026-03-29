import { memo } from 'react';
import { Cog, Lightbulb } from 'lucide-react';
import styles from './hud.module.css';

interface StatusIndicatorsProps {
  engineOn: boolean;
  engineHealth: number; // 0–1000
  seatbeltOn: boolean;
  headlightsOn: boolean;
  inMotion: boolean; // speed > 0
}

/** Simple seatbelt SVG — no good Lucide match */
function SeatbeltIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z" />
      <path d="M6 14l6 8 6-8" />
      <line x1="12" y1="10" x2="12" y2="22" />
    </svg>
  );
}

function getIndicatorState(
  active: boolean,
  warning: boolean,
): string {
  if (warning) return styles.indicatorWarning;
  if (active) return styles.indicatorActive;
  return styles.indicatorOff;
}

export const StatusIndicators = memo(function StatusIndicators({
  engineOn,
  engineHealth,
  seatbeltOn,
  headlightsOn,
  inMotion,
}: StatusIndicatorsProps) {
  // Engine: green when running, red when damaged (<300 health)
  const engineDamaged = engineOn && engineHealth < 300;
  const engineState = getIndicatorState(engineOn && !engineDamaged, engineDamaged);

  // Seatbelt: green when buckled, red when unbuckled and moving
  const beltWarning = !seatbeltOn && inMotion;
  const beltState = getIndicatorState(seatbeltOn, beltWarning);

  // Lights: green when on, dim when off (no warning state)
  const lightsState = getIndicatorState(headlightsOn, false);

  return (
    <div className={styles.indicators}>
      <div className={styles.indicator}>
        <div className={`${styles.indicatorIcon} ${engineState}`}>
          <Cog size={10} />
        </div>
        <div className={styles.indicatorLabel}>ENG</div>
      </div>
      <div className={styles.indicator}>
        <div className={`${styles.indicatorIcon} ${beltState}`}>
          <SeatbeltIcon />
        </div>
        <div className={styles.indicatorLabel}>BELT</div>
      </div>
      <div className={styles.indicator}>
        <div className={`${styles.indicatorIcon} ${lightsState}`}>
          <Lightbulb size={10} />
        </div>
        <div className={styles.indicatorLabel}>LIGHT</div>
      </div>
    </div>
  );
});
