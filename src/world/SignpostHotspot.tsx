import { useEffect, useRef } from 'react';
import { copy } from '../content/copy';
import { remainingItems, useGame } from '../game/store';
import type { SceneHandle } from '../scene/createScene';
import { QuestMarker } from '../ui/QuestMarker';
import { SIGNPOST } from './layout';
import '../ui/chrome.css';

const W = 80;
const H = 120;

export function SignpostHotspot({ scene }: { scene: SceneHandle | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const marked = useGame((s) => remainingItems(s.inventory).length === 0 && !s.contactSeen);
  const open = useGame((s) => s.setContactOpen);

  useEffect(() => {
    if (!scene || !ref.current) return;
    return scene.pinAnchor(ref.current, SIGNPOST.x - W / 2, SIGNPOST.feetY - H);
  }, [scene]);

  return (
    <div ref={ref} className="anchor" style={{ width: W, height: H, display: scene ? undefined : 'none' }}>
      {marked && (
        <div className="signpost-marker">
          <QuestMarker />
        </div>
      )}
      <button type="button" className="signpost-hit" aria-label={copy.contact.label} onClick={() => open(true)} />
    </div>
  );
}
