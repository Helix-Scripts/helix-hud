import { useState, useEffect, useCallback } from 'react';
import type { StatusData, VehicleData, PlayerInfo, HudConfig, NuiMessage } from '../types';

const defaultStatus: StatusData = {
  health: 100,
  armor: 0,
  hunger: 100,
  thirst: 100,
  stress: 0,
  stamina: 100,
};

const defaultVehicle: VehicleData = {
  active: false,
  speed: 0,
  rpm: 0,
  fuel: 0,
  engine: false,
  seatbelt: false,
  lightsOn: false,
  speedUnit: 'kmh',
};

const defaultPlayerInfo: PlayerInfo = {
  cash: 0,
  bank: 0,
  job: '',
  serverId: 0,
};

const defaultConfig: HudConfig = {
  elements: {
    health: true,
    armor: true,
    hunger: true,
    thirst: true,
    stress: false,
    stamina: true,
    cash: true,
    bank: false,
    job: true,
    serverId: true,
  },
  vehicle: {
    enabled: true,
    speedUnit: 'kmh',
    fuelScript: 'auto',
    seatbelt: true,
  },
  theme: 'dark',
  position: 'bottom-right',
  scale: 1.0,
};

export function useHudData() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<StatusData>(defaultStatus);
  const [vehicle, setVehicle] = useState<VehicleData>(defaultVehicle);
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo>(defaultPlayerInfo);
  const [config, setConfig] = useState<HudConfig>(defaultConfig);

  const handleMessage = useCallback((event: MessageEvent<NuiMessage>) => {
    const msg = event.data;
    if (!msg || !msg.action) return;

    switch (msg.action) {
      case 'setVisible':
        setVisible(msg.visible);
        break;
      case 'updateHud':
        setStatus(msg.status);
        setVehicle(msg.vehicle);
        setPlayerInfo(msg.playerInfo);
        if (msg.config) setConfig(msg.config);
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  return { visible, status, vehicle, playerInfo, config };
}
