import { useEffect, useMemo } from 'react';
import { useHudData } from './hooks/useHudData';
import { StatusBar } from './components/StatusBar';
import { PlayerInfoDisplay } from './components/PlayerInfo';
import { VehicleHud } from './components/VehicleHud';
import styles from './styles/hud.module.css';

declare function GetParentResourceName(): string;

/** Color palette — matches Volt's design spec */
const COLORS = {
  health: '#4ade80',
  armor: '#22d3ee',
  hunger: '#fbbf24',
  thirst: '#38bdf8',
  stress: '#ef4444',
  stamina: '#a78bfa',
} as const;

const ICONS = {
  health: '❤',
  armor: '🛡',
  hunger: '🍔',
  thirst: '💧',
  stress: '⚡',
  stamina: '🏃',
} as const;

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

  // Build position class
  const positionClass = useMemo(() => {
    switch (config.position) {
      case 'bottom-left':
        return styles.positionBottomLeft;
      case 'bottom-center':
        return styles.positionBottomCenter;
      default:
        return styles.positionBottomRight;
    }
  }, [config.position]);

  const themeClass = config.theme === 'light' ? styles.themeLight : '';

  // Build status bars based on config — only show bars that are relevant
  const bars = useMemo(() => {
    const entries: { key: string; label: string; value: number; color: string; icon: string }[] =
      [];
    const el = config.elements;

    if (el.health)
      entries.push({
        key: 'health',
        label: 'Health',
        value: status.health,
        color: COLORS.health,
        icon: ICONS.health,
      });
    if (el.armor && status.armor > 0)
      entries.push({
        key: 'armor',
        label: 'Armor',
        value: status.armor,
        color: COLORS.armor,
        icon: ICONS.armor,
      });
    if (el.hunger)
      entries.push({
        key: 'hunger',
        label: 'Hunger',
        value: status.hunger,
        color: COLORS.hunger,
        icon: ICONS.hunger,
      });
    if (el.thirst)
      entries.push({
        key: 'thirst',
        label: 'Thirst',
        value: status.thirst,
        color: COLORS.thirst,
        icon: ICONS.thirst,
      });
    if (el.stress && status.stress > 0)
      entries.push({
        key: 'stress',
        label: 'Stress',
        value: status.stress,
        color: COLORS.stress,
        icon: ICONS.stress,
      });
    if (el.stamina && status.stamina < 100)
      entries.push({
        key: 'stamina',
        label: 'Stamina',
        value: status.stamina,
        color: COLORS.stamina,
        icon: ICONS.stamina,
      });

    return entries;
  }, [config.elements, status]);

  const containerStyle = useMemo(
    () => ({
      transform: `scale(${config.scale})`,
      transformOrigin:
        config.position === 'bottom-left'
          ? 'bottom left'
          : config.position === 'bottom-center'
            ? 'bottom center'
            : 'bottom right',
    }),
    [config.scale, config.position],
  );

  return (
    <div
      className={`${styles.hudContainer} ${positionClass} ${themeClass} ${!visible ? styles.hidden : ''}`}
      style={containerStyle}
    >
      <PlayerInfoDisplay info={playerInfo} elements={config.elements} />

      <div className={styles.statusBars}>
        {bars.map((bar) => (
          <StatusBar
            key={bar.key}
            label={bar.label}
            value={bar.value}
            color={bar.color}
            icon={bar.icon}
          />
        ))}
      </div>

      {config.vehicle.enabled && (
        <VehicleHud data={vehicle} showSeatbelt={config.vehicle.seatbelt} />
      )}
    </div>
  );
}

export default App;
