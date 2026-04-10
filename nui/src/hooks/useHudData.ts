import { useState, useEffect, useCallback, useRef } from 'react';
import type { HudState, HudConfig, NuiMessage, HudPositions } from '../types';
import { isEnvBrowser } from '../utils/envBrowser';
import { MOCK_HUD_STATE } from '../utils/mockData';

const DEFAULT_POSITIONS: HudPositions = {
  vehicleCluster: { bottom: 40, right: 60 },
  statBars: { bottom: 14, left: 40 },
  idJob: { top: 28, right: 40 },
  gear: { bottom: 180, right: 148 },
};

const DEFAULT_STATE: HudState = {
  health: 100,
  armor: 0,
  hunger: 100,
  thirst: 100,
  stress: 0,
  playerId: 0,
  jobLabel: '',
  showIdJob: true,
  inVehicle: false,
  speed: 0,
  rpm: 0,
  gear: 0,
  fuel: 0,
  engineOn: false,
  seatbeltOn: false,
  headlightsOn: false,
  engineHealth: 1000,
};

const DEFAULT_CONFIG: HudConfig = {
  theme: 'dark',
  speedUnit: 'kmh',
  autoHide: false,
  showValuesAlways: false,
  positions: DEFAULT_POSITIONS,
};

export function useHudData() {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<HudState>(DEFAULT_STATE);
  const [config, setConfig] = useState<HudConfig>(DEFAULT_CONFIG);
  const [showValues, setShowValues] = useState(false);
  const stateRef = useRef(state);

  // Keep ref in sync for partial merges
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const handleMessage = useCallback((event: MessageEvent<NuiMessage>) => {
    const msg = event.data;
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'hud:update':
        setState(prev => ({ ...prev, ...msg.data }));
        break;
      case 'hud:visibility':
        setVisible(msg.visible);
        break;
      case 'hud:config':
        setConfig(prev => ({ ...prev, ...msg.config }));
        break;
      case 'hud:showValues':
        setShowValues(msg.show);
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // In browser dev mode, seed mock data so the HUD renders visibly
  useEffect(() => {
    if (!isEnvBrowser()) return;

    // Make the HUD visible
    setVisible(true);

    // Apply mock state
    setState(prev => ({ ...prev, ...MOCK_HUD_STATE }));
  }, []);

  return { visible, state, config, showValues };
}
