import { memo } from 'react';
import { SpeedReadout } from './SpeedReadout';
import { RpmBar } from './RpmBar';
import { FuelBar } from './FuelBar';
import { StatusIndicators } from './StatusIndicators';
import styles from './hud.module.css';
import type { HudState, HudPositions } from '../../types';

interface VehicleClusterProps {
  state: HudState;
  positions: HudPositions;
  speedUnit: 'kmh' | 'mph';
}

export const VehicleCluster = memo(function VehicleCluster({
  state,
  positions,
  speedUnit,
}: VehicleClusterProps) {
  const { inVehicle, speed, rpm, gear, fuel, engineOn, seatbeltOn, headlightsOn, engineHealth } = state;

  return (
    <>
      <div
        className={`${styles.vehicleCluster} ${!inVehicle ? styles.vehicleClusterHidden : ''}`}
        style={{
          bottom: positions.vehicleCluster.bottom,
          right: positions.vehicleCluster.right,
        }}
      >
        <SpeedReadout speed={speed} unit={speedUnit} />
        <RpmBar rpm={rpm} gear={gear} />
        <FuelBar fuel={fuel} />
        <StatusIndicators
          engineOn={engineOn}
          engineHealth={engineHealth}
          seatbeltOn={seatbeltOn}
          headlightsOn={headlightsOn}
          inMotion={speed > 0}
        />
      </div>
    </>
  );
});
