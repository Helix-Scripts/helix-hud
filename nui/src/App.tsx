import { useEffect, useMemo } from 'react';
import { useHudData } from './hooks/useHudData';
import { StatusBar } from './components/StatusBar';
import { PlayerInfoDisplay } from './components/PlayerInfo';
import { VehicleHud } from './components/VehicleHud';
import {
  Heart,
  Shield,
  Utensils,
  Droplets,
  Zap,
  Wind,
} from 'lucide-react';
import styles from './styles/hud.module.css';
import type { LucideIcon } from 'lucide-react';

declare function GetParentResourceName(): string;

/** Bar color config — gradients + glow per Pixel design spec v1.0 */
interface BarColor {
  gradientStart: string;
  gradientEnd: string;
  glow: string;
  iconColor: string;
}

const BAR_COLORS: Record<string, BarColor> = {
  health: {
    gradientStart: '#10B981',
    gradientEnd: '#34D399',
    glow: 'rgba(52, 211, 153, 0.35)',
    iconColor: 'rgba(52, 211, 153, 0.90)',
  },
  armor: {
    gradientStart: '#06B6D4',
    gradientEnd: '#22D3EE',
    glow: 'rgba(34, 211, 238, 0.35)',
    iconColor: 'rgba(34, 211, 238, 0.90)',
  },
  hunger: {
    gradientStart: '#F59E0B',
    gradientEnd: '#FBBF24',
    glow: 'rgba(251, 191, 36, 0.30)',
    iconColor: 'rgba(251, 191, 36, 0.90)',
  },
  thirst: {
    gradientStart: '#0EA5E9',
    gradientEnd: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.35)',
    iconColor: 'rgba(56, 189, 248, 0.90)',
  },
  stress: {
    gradientStart: '#EF4444',
    gradientEnd: '#F87171',
    glow: 'rgba(248, 113, 113, 0.35)',
    iconColor: 'rgba(248, 113, 113, 0.90)',
  },
  stamina: {
    gradientStart: '#8B5CF6',
    gradientEnd: '#A78BFA',
    glow: 'rgba(167, 139, 250, 0.35)',
    iconColor: 'rgba(167, 139, 250, 0.90)',
  },
} as const;

const BAR_ICONS: Record<string, LucideIcon> = {
  health: Heart,
  armor: Shield,
  hunger: Utensils,
  thirst: Droplets,
  stress: Zap,
  stamina: Wind,
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
    const entries: {
      key: string;
      label: string;
      value: number;
      colors: BarColor;
      Icon: LucideIcon;
    }[] = [];
    const el = config.elements;

    if (el.health)
      entries.push({
        key: 'health',
        label: 'Health',
        value: status.health,
        colors: BAR_COLORS.health,
        Icon: BAR_ICONS.health,
      });
    if (el.armor && status.armor > 0)
      entries.push({
        key: 'armor',
        label: 'Armor',
        value: status.armor,
        colors: BAR_COLORS.armor,
        Icon: BAR_ICONS.armor,
      });
    if (el.hunger)
      entries.push({
        key: 'hunger',
        label: 'Hunger',
        value: status.hunger,
        colors: BAR_COLORS.hunger,
        Icon: BAR_ICONS.hunger,
      });
    if (el.thirst)
      entries.push({
        key: 'thirst',
        label: 'Thirst',
        value: status.thirst,
        colors: BAR_COLORS.thirst,
        Icon: BAR_ICONS.thirst,
      });
    if (el.stress && status.stress > 0)
      entries.push({
        key: 'stress',
        label: 'Stress',
        value: status.stress,
        colors: BAR_COLORS.stress,
        Icon: BAR_ICONS.stress,
      });
    if (el.stamina && status.stamina < 100)
      entries.push({
        key: 'stamina',
        label: 'Stamina',
        value: status.stamina,
        colors: BAR_COLORS.stamina,
        Icon: BAR_ICONS.stamina,
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

      <div className={styles.statusContainer}>
        <div className={styles.statusBars}>
          {bars.map((bar) => (
            <StatusBar
              key={bar.key}
              label={bar.label}
              value={bar.value}
              colors={bar.colors}
              Icon={bar.Icon}
            />
          ))}
        </div>
      </div>

      {config.vehicle.enabled && (
        <VehicleHud data={vehicle} showSeatbelt={config.vehicle.seatbelt} />
      )}
    </div>
  );
}

export default App;
