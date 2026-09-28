import { useEffect, useState } from 'react';
import { SIGN_NAME, SIGN_SUBTITLE } from './content/copy';
import { useGame } from './game/store';
import { DruidOverlay } from './npc/DruidOverlay';
import type { SceneHandle } from './scene/createScene';
import { SceneCanvas } from './scene/SceneCanvas';

export default function App() {
  const [scene, setScene] = useState<SceneHandle | null>(null);
  const [skipIntro] = useState(() => useGame.getState().introSeen);

  useEffect(() => {
    if (!scene) return;
    const s = useGame.getState();
    if (s.druid !== 'offstage') return;
    if (skipIntro) s.setDruid('patrolling');
    else s.startDruidEntrance();
  }, [scene, skipIntro]);

  return (
    <>
      <h1 className="sr-only">
        {SIGN_NAME} — {SIGN_SUBTITLE}
      </h1>
      <SceneCanvas onReady={setScene} druidOverlay={<DruidOverlay />} />
    </>
  );
}
