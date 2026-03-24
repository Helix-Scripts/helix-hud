import { memo, useMemo } from 'react';
import { Heart, Shield, Activity } from 'lucide-react';
import styles from '../styles/hud.module.css';

interface VitalsPanelProps {
  health: number;
  armor: number;
  stamina: number;
}

const HEALTH_CIRCUMFERENCE = 2 * Math.PI * 25; // ~157
const STAMINA_ARC_LENGTH = 108;

function VitalsPanelComponent({ health, armor, stamina }: VitalsPanelProps) {
  const healthOffset = useMemo(
    () => HEALTH_CIRCUMFERENCE * (1 - Math.max(0, Math.min(100, health)) / 100),
    [health],
  );

  const staminaOffset = useMemo(
    () => STAMINA_ARC_LENGTH * (1 - Math.max(0, Math.min(100, stamina)) / 100),
    [stamina],
  );

  const filledSegments = Math.round(Math.max(0, Math.min(100, armor)) / 10);

  const isHealthLow = health < 50;
  const isHealthFull = health >= 100;

  return (
    <div className={`${styles.panel} ${styles.vitalsPanel}`}>
      <div className={styles.clusterLabel}>Vitals</div>
      <div className={styles.vitalsContent}>
        {/* Health Ring */}
        <div className={styles.healthRing}>
          <svg viewBox="0 0 60 60" className={styles.healthRingSvg}>
            <circle
              cx="30"
              cy="30"
              r="25"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="4.5"
            />
            <circle
              cx="30"
              cy="30"
              r="25"
              fill="none"
              stroke="url(#healthGrad)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray={HEALTH_CIRCUMFERENCE}
              strokeDashoffset={healthOffset}
              className={`${styles.healthFill} ${isHealthFull ? styles.dimFull : ''}`}
              style={
                isHealthLow
                  ? {
                      filter:
                        'drop-shadow(0 0 6px rgba(16, 185, 129, 0.45))',
                    }
                  : undefined
              }
            />
          </svg>
          <div className={styles.healthCenter}>
            <div className={styles.healthCenterIcon}>
              <Heart size={12} strokeWidth={2} />
            </div>
            <span className={styles.healthCenterValue}>{health}</span>
          </div>
        </div>

        {/* Secondary Vitals: Armor + Stamina */}
        <div className={styles.secondaryVitals}>
          {/* Armor Segments */}
          <div className={styles.statRow}>
            <div className={styles.statHeader}>
              <div className={`${styles.statIcon} ${styles.armorIcon}`}>
                <Shield size={10} strokeWidth={1.75} />
              </div>
              <span
                className={styles.statValue}
                style={{ color: 'rgba(34, 211, 238, 0.65)' }}
              >
                {armor}
              </span>
            </div>
            <div className={styles.armorSegments}>
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`${styles.armorSegment} ${
                    i < filledSegments
                      ? styles.armorSegmentFilled
                      : styles.armorSegmentEmpty
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Stamina Arc */}
          <div className={styles.statRow}>
            <div className={styles.statHeader}>
              <div className={`${styles.statIcon} ${styles.staminaIcon}`}>
                <Activity size={10} strokeWidth={1.75} />
              </div>
              <span
                className={styles.statValue}
                style={{ color: 'rgba(167, 139, 250, 0.65)' }}
              >
                {stamina}
              </span>
            </div>
            <div className={styles.staminaArc}>
              <svg viewBox="0 0 100 16" preserveAspectRatio="none">
                <path
                  d="M 3 13 Q 50 -2 97 13"
                  fill="none"
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M 3 13 Q 50 -2 97 13"
                  fill="none"
                  stroke="url(#staminaGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={STAMINA_ARC_LENGTH}
                  strokeDashoffset={staminaOffset}
                  className={stamina >= 100 ? styles.dimFull : undefined}
                  style={{
                    filter:
                      'drop-shadow(0 0 2px rgba(139, 92, 246, 0.18))',
                  }}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const VitalsPanel = memo(VitalsPanelComponent);
