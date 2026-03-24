import { memo, useMemo } from 'react';
import { Utensils, Droplets } from 'lucide-react';
import styles from '../styles/hud.module.css';

interface NeedsPanelProps {
  hunger: number;
  thirst: number;
  stress: number;
}

function NeedsPanelComponent({ hunger, thirst, stress }: NeedsPanelProps) {
  const hungerClamped = Math.max(0, Math.min(100, hunger));
  const thirstClamped = Math.max(0, Math.min(100, thirst));
  const stressClamped = Math.max(0, Math.min(100, stress));

  const stressOffset = useMemo(
    () => 82 * (1 - stressClamped / 100),
    [stressClamped],
  );

  const isHungerLow = hungerClamped < 50;
  const isThirstFull = thirstClamped >= 100;
  const isStressPulsing = stressClamped > 30;

  return (
    <div className={`${styles.panel} ${styles.needsPanel}`}>
      <div className={styles.clusterLabel}>Needs</div>
      <div className={styles.needsContent}>
        {/* Hunger Tube */}
        <div className={styles.fillTube}>
          <div
            className={`${styles.tubeContainer} ${isHungerLow ? styles.tubeContainerWarn : ''}`}
          >
            <div
              className={`${styles.tubeFill} ${styles.tubeFillHunger}`}
              style={{ height: `${hungerClamped}%` }}
            />
          </div>
          <div className={`${styles.tubeIcon} ${styles.tubeIconHunger}`}>
            <Utensils size={8} strokeWidth={1.75} />
          </div>
          <span className={styles.tubeValue}>{hungerClamped}</span>
        </div>

        {/* Thirst Tube */}
        <div className={styles.fillTube}>
          <div className={styles.tubeContainer}>
            <div
              className={`${styles.tubeFill} ${styles.tubeFillThirst} ${isThirstFull ? styles.dimFull : ''}`}
              style={{ height: `${thirstClamped}%` }}
            />
          </div>
          <div className={`${styles.tubeIcon} ${styles.tubeIconThirst}`}>
            <Droplets size={8} strokeWidth={1.75} />
          </div>
          <span
            className={styles.tubeValue}
            style={isThirstFull ? { opacity: 0.3 } : undefined}
          >
            {thirstClamped}
          </span>
        </div>

        {/* Stress Ring */}
        <div className={styles.stressRing}>
          <div className={styles.stressRingSvgWrap}>
            <svg viewBox="0 0 36 36" className={styles.stressRingSvg}>
              <circle
                cx="18"
                cy="18"
                r="13"
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="3.5"
              />
              <circle
                cx="18"
                cy="18"
                r="13"
                fill="none"
                stroke="url(#stressGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="82"
                strokeDashoffset={stressOffset}
                className={isStressPulsing ? styles.stressPulse : undefined}
              />
            </svg>
            <div className={styles.stressCenterIcon}>
              {/* Lightbulb + pulse icon from mockup */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="12"
                height="12"
              >
                <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                <path d="M9 21h6M10 17v1M14 17v1M12 2v1" />
                <path d="M8.5 9h1.5l1 2 2-4 1 2h1.5" />
              </svg>
            </div>
          </div>
          <span className={styles.stressValue}>{stressClamped}</span>
        </div>
      </div>
    </div>
  );
}

export const NeedsPanel = memo(NeedsPanelComponent);
