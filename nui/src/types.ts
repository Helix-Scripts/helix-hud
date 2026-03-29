/** Ghost HUD v3 — Type Definitions */

export interface HudState {
  // Character stats (always visible)
  health: number;   // 0–100
  armor: number;    // 0–100
  hunger: number;   // 0–100
  thirst: number;   // 0–100
  stress: number;   // 0–100

  // Identity (toggleable)
  playerId: number;
  jobLabel: string;
  showIdJob: boolean;

  // Vehicle (visible only when in vehicle)
  inVehicle: boolean;
  speed: number;     // km/h or mph integer
  rpm: number;       // 0.0–1.0 normalized
  gear: number;      // -1=R, 0=N, 1–6=forward
  fuel: number;      // 0–100

  // Vehicle indicators
  engineOn: boolean;
  seatbeltOn: boolean;
  headlightsOn: boolean;
  engineHealth: number;  // 0–1000 (GTA native)
}

export interface HudConfig {
  theme: 'dark' | 'light' | 'auto';
  speedUnit: 'kmh' | 'mph';
  autoHide: boolean;
  showValuesAlways: boolean;
  positions: HudPositions;
}

export interface HudPositions {
  vehicleCluster: { bottom: number; right: number };
  statBars: { bottom: number; left: number };
  idJob: { top: number; right: number };
  gear: { bottom: number; right: number };
}

export interface HudUpdateMessage {
  type: 'hud:update';
  data: Partial<HudState>;
}

export interface HudVisibilityMessage {
  type: 'hud:visibility';
  visible: boolean;
}

export interface HudConfigMessage {
  type: 'hud:config';
  config: Partial<HudConfig>;
}

export interface HudShowValuesMessage {
  type: 'hud:showValues';
  show: boolean;
}

export type NuiMessage =
  | HudUpdateMessage
  | HudVisibilityMessage
  | HudConfigMessage
  | HudShowValuesMessage;
