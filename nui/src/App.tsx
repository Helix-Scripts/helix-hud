import { useEffect } from 'react';
import { useHudData } from './hooks/useHudData';
import { HudRoot } from './components/hud/HudRoot';

declare function GetParentResourceName(): string;

function App() {
  const { visible, state, config, showValues } = useHudData();

  // Notify Lua that NUI is ready
  useEffect(() => {
    fetch(`https://${GetParentResourceName()}/hudReady`, {
      method: 'POST',
      body: JSON.stringify({}),
    }).catch(() => {
      /* dev mode — no resource name */
    });
  }, []);

  return (
    <HudRoot
      visible={visible}
      state={state}
      config={config}
      showValues={showValues}
    />
  );
}

export default App;
