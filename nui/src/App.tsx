import { useState, useEffect, useCallback } from 'react';
import Hud from './components/Hud';

interface StatusData {
  health: number;
  armor: number;
  hunger: number;
  thirst: number;
  stress: number;
}

function App() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<StatusData>({
    health: 100,
    armor: 0,
    hunger: 100,
    thirst: 100,
    stress: 0,
  });

  const handleMessage = useCallback((event: MessageEvent) => {
    const { action, data } = event.data;

    switch (action) {
      case 'setVisible':
        setVisible(data.visible);
        break;
      case 'updateStatus':
        setStatus(data);
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);

    // Notify the client that the NUI is ready
    fetch(`https://${GetParentResourceName()}/hudReady`, {
      method: 'POST',
      body: JSON.stringify({}),
    }).catch(() => {});

    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  if (!visible) return null;

  return <Hud status={status} />;
}

declare function GetParentResourceName(): string;

export default App;
