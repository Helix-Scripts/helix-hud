import { useEffect, useMemo } from 'react';
import {
  Heart,
  Shield,
  Utensils,
  Droplets,
  Zap,
  Wind,
  Waves,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useHudData } from './hooks/useHudData';
import { StatusBar } from './components/StatusBar';
import { PlayerInfoDisplay } from './components/PlayerInfo';
import { VehicleHud } from './components/VehicleHud';
import styles from './styles/hud.module.css';

declare function GetParentResourceName(): string;

/** Bar color definitions — gradient fills + glow per design spec v2 */
interface BarColor {
  gradient: string;
  glow: string;
  iconColor: string;
}

const BAR_COLORS: Record<string, BarColor> = {
  health: {
    gradient: 'linear-gradient(90deg, #22c55e, #4ade80)',
    glow: '0 0 8px rgba(74, 222, 128, 0.4)',
    iconColor: 'rgba(74, 222, 128, 0.85)',
  },
  armor: {
    gradient: 'linear-gradient(90deg, #06b6d4, #22d3ee)',
    glow: '0 0 8px rgba(34, 211, 238, 0.4)',
    iconColor: 'rgba(34, 211, 238, 0.85)',
  },
  hunger: {
    gradient: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
    glow: '0 0 8px rgba(251, 191, 36, 0.35)',
    iconColor: 'rgba(251, 191, 36, 0.85)',
  },
  thirst: {
    gradient: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
    glow: '0 0 8px rgba(56, 189, 248, 0.4)',
    iconColor: 'rgba(56, 189, 248, 0.85)',
  },
  stress: {
    gradient: 'linear-gradient(90deg, #dc2626, #ef4444)',
    glow: '0 0 8px rgba(239, 68, 68, 0.4)',
    iconColor: 'rgba(239, 68, 68, 0.85)',
  },
  stamina: {
    gradient: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
    glow: '0 0 8px rgba(167, 139, 250, 0.4)',
    iconColor: 'rgba(167, 139, 250, 0.85)',
  },
  oxygen: {
    gradient: 'linear-gradient(90deg, #14b8a6, #2dd4bf)',
    glow: '0 0 8px rgba(45, 212, 191, 0.4)',
    iconColor: 'rgba(45, 212, 191, 0.85)',
  },
} as const;

/** Icon mapping using Lucide React components */
const BAR_ICONS: Record<string, ReactNode> = {
  health: <Heart size={14} strokeWidth={2} />,
  armor: <Shield size={14} strokeWidth={2} />,
  hunger: <Utensils size={14} strokeWidth={2} />,
  thirst: <Droplets size={14} strokeWidth={2} />,
  stress: <Zap size={14} strokeWidth={2} />,
  stamina: <Wind size={14} strokeWidth={2} />,
  oxygen: <Waves size={14} strokeWidth={2} />,
};

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
    const entries: {
      key: string;
      label: string;
      value: number;
      colors: BarColor;
      icon: ReactNode;
    }[] = [];
    const el = config.elements;

    if (el.health)
      entries.push({
        key: 'health',
        label: 'Health',
        value: status.health,
        colors: BAR_COLORS.health,
        icon: BAR_ICONS.health,
      });
    if (el.armor && status.armor > 0)
      entries.push({
        key: 'armor',
        label: 'Armor',
        value: status.armor,
        colors: BAR_COLORS.armor,
        icon: BAR_ICONS.armor,
      });
    if (el.hunger)
      entries.push({
        key: 'hunger',
        label: 'Hunger',
        value: status.hunger,
        colors: BAR_COLORS.hunger,
        icon: BAR_ICONS.hunger,
      });
    if (el.thirst)
      entries.push({
        key: 'thirst',
        label: 'Thirst',
        value: status.thirst,
        colors: BAR_COLORS.thirst,
        icon: BAR_ICONS.thirst,
      });
    if (el.stress && status.stress > 0)
      entries.push({
        key: 'stress',
        label: 'Stress',
        value: status.stress,
        colors: BAR_COLORS.stress,
        icon: BAR_ICONS.stress,
      });
    if (el.stamina && status.stamina < 100)
      entries.push({
        key: 'stamina',
        label: 'Stamina',
        value: status.stamina,
        colors: BAR_COLORS.stamina,
        icon: BAR_ICONS.stamina,
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
            colors={bar.colors}
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
