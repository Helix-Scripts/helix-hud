export interface StatusData {
  health: number;
  armor: number;
  hunger: number;
  thirst: number;
  stress: number;
  stamina: number;
}

export interface VehicleData {
  active: boolean;
  speed: number;
  rpm: number;
  fuel: number;
  engine: boolean;
  seatbelt: boolean;
  lightsOn: boolean;
  speedUnit: 'kmh' | 'mph';
}

export interface PlayerInfo {
  cash: number;
  bank: number;
  job: string;
  serverId: number;
}

export interface HudElements {
  health: boolean;
  armor: boolean;
  hunger: boolean;
  thirst: boolean;
  stress: boolean;
  stamina: boolean;
  cash: boolean;
  bank: boolean;
  job: boolean;
  serverId: boolean;
}

export interface VehicleConfig {
  enabled: boolean;
  speedUnit: 'kmh' | 'mph';
  fuelScript: string;
  seatbelt: boolean;
}

export interface HudConfig {
  elements: HudElements;
  vehicle: VehicleConfig;
  theme: 'dark' | 'light';
  position: 'bottom-right' | 'bottom-left' | 'bottom-center';
  scale: number;
}

export interface HudUpdateMessage {
  action: 'updateHud';
  status: StatusData;
  vehicle: VehicleData;
  playerInfo: PlayerInfo;
  config: HudConfig;
}

export interface VisibilityMessage {
  action: 'setVisible';
  visible: boolean;
}

export type NuiMessage = HudUpdateMessage | VisibilityMessage;
