import { lazy, Suspense, useState } from 'react';
import { SIGN_NAME, SIGN_SUBTITLE } from './content/copy';
import { DialoguePanel } from './dialogue/DialoguePanel';
import { useGame } from './game/store';
import { DruidOverlay } from './npc/DruidOverlay';
import type { SceneHandle } from './scene/createScene';
import { SceneCanvas } from './scene/SceneCanvas';
import { useSceneFx } from './scene/useSceneFx';
import { useSceneIntro } from './scene/useSceneIntro';
import { ContactModal } from './ui/ContactModal';
import { PortraitGate } from './ui/PortraitGate';
import { ReceiveFx } from './ui/ReceiveFx';
import { Satchel } from './ui/Satchel';
import { Splash } from './ui/Splash';
import { TopBar } from './ui/TopBar';
import { useGlobalKeys } from './ui/useGlobalKeys';
import { CatHotspot } from './world/CatHotspot';

const DocumentViewer = lazy(() => import('./ui/DocumentViewer').then(m => ({ default: m.DocumentViewer })));

export default function App() {
  const [scene, setScene] = useState<SceneHandle | null>(null);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [skipIntro] = useState(() => useGame.getState().introSeen);
  useSceneFx(scene);
  const { ready } = useSceneIntro(scene, skipIntro);
  const viewing = useGame((s) => s.viewing);
  useGlobalKeys();

  return (
    <>
      <h1 className="sr-only">
        {SIGN_NAME} — {SIGN_SUBTITLE}
      </h1>
      <SceneCanvas onReady={setScene} druidOverlay={<DruidOverlay />} onError={() => setSceneFailed(true)} />
      <CatHotspot scene={scene} />
      <TopBar />
      <Satchel />
      <DialoguePanel />
      <ReceiveFx />
      <Suspense fallback={null}>
        <DocumentViewer />
      </Suspense>
      <ContactModal />
      {!viewing && <PortraitGate />}
      <Splash visible={!(ready || sceneFailed)} />
    </>
  );
}
