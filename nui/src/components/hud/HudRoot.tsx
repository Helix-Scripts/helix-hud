import { useEffect, useRef } from 'react';
import { VehicleCluster } from './VehicleCluster';
import { StatBars } from './StatBars';
import { IdJob } from './IdJob';
import styles from './hud.module.css';
import type { HudState, HudConfig } from '../../types';

interface HudRootProps {
  visible: boolean;
  state: HudState;
  config: HudConfig;
  showValues: boolean;
}

export function HudRoot({ visible, state, config, showValues }: HudRootProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Resolution scaling: detect viewport and set CSS variable
  useEffect(() => {
    function updateScale() {
      const scale = window.innerWidth / 1920;
      document.documentElement.style.setProperty('--hud-scale', String(scale));
    }
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Theme: set data-theme attribute
  useEffect(() => {
    const resolvedTheme = config.theme === 'auto'
      ? getAutoTheme()
      : config.theme;
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [config.theme]);

  return (
    <div
      ref={rootRef}
      className={`${styles.hud} ${!visible ? styles.hudHidden : ''}`}
    >
      <IdJob
        playerId={state.playerId}
        jobLabel={state.jobLabel}
        visible={state.showIdJob}
        position={config.positions.idJob}
      />

      <StatBars
        state={state}
        position={config.positions.statBars}
        autoHide={config.autoHide}
        showValues={showValues || config.showValuesAlways}
      />

      <VehicleCluster
        state={state}
        positions={config.positions}
        speedUnit={config.speedUnit}
      />
    </div>
  );
}

/** Auto theme based on real-world time (06:00–18:00 = light) */
function getAutoTheme(): 'dark' | 'light' {
  const hour = new Date().getHours();
  return (hour >= 6 && hour < 18) ? 'light' : 'dark';
}
