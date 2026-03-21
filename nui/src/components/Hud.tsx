interface StatusData {
  health: number;
  armor: number;
  hunger: number;
  thirst: number;
  stress: number;
}

interface HudProps {
  status: StatusData;
}

const barStyle = (color: string, value: number): React.CSSProperties => ({
  width: `${Math.max(0, Math.min(100, value))}%`,
  height: '8px',
  backgroundColor: color,
  borderRadius: '4px',
  transition: 'width 0.3s ease',
});

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  minWidth: '180px',
};

const trackStyle: React.CSSProperties = {
  width: '100%',
  height: '8px',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  borderRadius: '4px',
};

function Hud({ status }: HudProps) {
  const bars = [
    { label: 'Health', color: '#e74c3c', value: status.health },
    { label: 'Armor', color: '#3498db', value: status.armor },
    { label: 'Hunger', color: '#e67e22', value: status.hunger },
    { label: 'Thirst', color: '#2ecc71', value: status.thirst },
    { label: 'Stress', color: '#9b59b6', value: status.stress },
  ];

  return (
    <div style={containerStyle}>
      {bars.map((bar) => (
        <div key={bar.label} style={trackStyle} title={bar.label}>
          <div style={barStyle(bar.color, bar.value)} />
        </div>
      ))}
    </div>
  );
}

export default Hud;
