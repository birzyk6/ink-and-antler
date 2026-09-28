import { useEffect, useState } from 'react';
import { SIGN_NAME, SIGN_SUBTITLE } from './content/copy';
import { DialoguePanel } from './dialogue/DialoguePanel';
import { useGame } from './game/store';
import { DruidOverlay } from './npc/DruidOverlay';
import type { SceneHandle } from './scene/createScene';
import { SceneCanvas } from './scene/SceneCanvas';
import { DocumentViewer } from './ui/DocumentViewer';
import { ReceiveFx } from './ui/ReceiveFx';
import { Satchel } from './ui/Satchel';
import { useGlobalKeys } from './ui/useGlobalKeys';

export default function App() {
  const [scene, setScene] = useState<SceneHandle | null>(null);
  const [skipIntro] = useState(() => useGame.getState().introSeen);
  useGlobalKeys();

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
      <Satchel />
      <DialoguePanel />
      <ReceiveFx />
      <DocumentViewer />
    </>
  );
}
