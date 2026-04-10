import type { HudState } from '../types';

/**
 * Mock HUD state used when running in browser dev mode.
 * Provides representative values for every HUD element so
 * all components render visibly.
 */
export const MOCK_HUD_STATE: Partial<HudState> = {
  health: 75,
  armor: 50,
  hunger: 60,
  thirst: 45,
  stress: 20,
  playerId: 42,
  jobLabel: 'Police Officer',
  showIdJob: true,
  inVehicle: true,
  speed: 85,
  rpm: 0.6,
  gear: 4,
  fuel: 72,
  engineOn: true,
  seatbeltOn: true,
  headlightsOn: false,
  engineHealth: 850,
};
