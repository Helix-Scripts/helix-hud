import { useEffect } from 'react';
import { useHudData } from './hooks/useHudData';
import { SvgDefs } from './components/SvgDefs';
import { InfoPills } from './components/InfoPills';
import { VitalsPanel } from './components/VitalsPanel';
import { NeedsPanel } from './components/NeedsPanel';
import { VehiclePanel } from './components/VehiclePanel';
import styles from './styles/hud.module.css';

declare function GetParentResourceName(): string;

function App() {
  const { visible, status, vehicle, playerInfo, config } = useHudData();

  // Notify Lua that NUI is ready
  useEffect(() => {
    fetch(`https://${GetParentResourceName()}/hudReady`, {
      method: 'POST',
      body: JSON.stringify({}),
    }).catch(() => {
      /* dev mode — no resource name */
    });
  }, []);

  return (
    <div className={`${styles.hudRoot} ${!visible ? styles.hidden : ''}`}>
      <SvgDefs />

      {/* Top-right: Info Pills */}
      <InfoPills info={playerInfo} elements={config.elements} />

      {/* Bottom-left: Vitals + Needs */}
      <div className={styles.hudLeft}>
        <VitalsPanel
          health={status.health}
          armor={status.armor}
          stamina={status.stamina}
        />
        <NeedsPanel
          hunger={status.hunger}
          thirst={status.thirst}
          stress={status.stress}
        />
      </div>

      {/* Bottom-right: Vehicle (conditional) */}
      {config.vehicle.enabled && (
        <VehiclePanel data={vehicle} showSeatbelt={config.vehicle.seatbelt} />
      )}
    </div>
  );
}

export default App;
