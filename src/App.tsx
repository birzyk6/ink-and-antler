import { useState } from 'react';
import { SIGN_NAME, SIGN_SUBTITLE } from './content/copy';
import { DialoguePanel } from './dialogue/DialoguePanel';
import { useGame } from './game/store';
import { DruidOverlay } from './npc/DruidOverlay';
import type { SceneHandle } from './scene/createScene';
import { SceneCanvas } from './scene/SceneCanvas';
import { useSceneFx } from './scene/useSceneFx';
import { useSceneIntro } from './scene/useSceneIntro';
import { ContactModal } from './ui/ContactModal';
import { DocumentViewer } from './ui/DocumentViewer';
import { PortraitGate } from './ui/PortraitGate';
import { ReceiveFx } from './ui/ReceiveFx';
import { Satchel } from './ui/Satchel';
import { Splash } from './ui/Splash';
import { TopBar } from './ui/TopBar';
import { useGlobalKeys } from './ui/useGlobalKeys';
import { SignpostHotspot } from './world/SignpostHotspot';

export default function App() {
  const [scene, setScene] = useState<SceneHandle | null>(null);
  const [skipIntro] = useState(() => useGame.getState().introSeen);
  const fx = useSceneFx(scene);
  // fx is a ref; the intro reads it when each torch lights.
  const { ready } = useSceneIntro(scene, skipIntro, (x, y) => fx.current?.ignite(x, y));
  const viewing = useGame((s) => s.viewing);
  useGlobalKeys();

  return (
    <>
      <h1 className="sr-only">
        {SIGN_NAME} — {SIGN_SUBTITLE}
      </h1>
      <SceneCanvas onReady={setScene} druidOverlay={<DruidOverlay />} />
      <SignpostHotspot scene={scene} />
      <TopBar />
      <Satchel />
      <DialoguePanel />
      <ReceiveFx />
      <DocumentViewer />
      <ContactModal />
      {!viewing && <PortraitGate />}
      <Splash visible={!ready} />
    </>
  );
}
