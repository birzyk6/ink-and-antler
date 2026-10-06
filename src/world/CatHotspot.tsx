import { useEffect, useRef, useState } from 'react';
import { copy } from '../content/copy';
import { prefersReducedMotion } from '../engine/motion';
import { remainingItems, useGame } from '../game/store';
import type { SceneHandle } from '../scene/createScene';
import { QuestMarker } from '../ui/QuestMarker';
import { SpeechBubble } from '../ui/SpeechBubble';
import { CAT } from './layout';
import '../ui/chrome.css';

const W = 90;
const H = 70;
const MEOW_MS = 1600;
/** Long enough to see the meow before the fast-travel card covers it. */
const FAST_TRAVEL_DELAY_MS = 700;

export function CatHotspot({ scene }: { scene: SceneHandle | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const travelTimer = useRef<number | undefined>(undefined);
  const allWon = useGame((s) => remainingItems(s.inventory).length === 0);
  const contactSeen = useGame((s) => s.contactSeen);
  const openFastTravel = useGame((s) => s.setContactOpen);
  const [pets, setPets] = useState(0);
  const [meowing, setMeowing] = useState(false);

  useEffect(() => {
    if (!scene || !ref.current) return;
    return scene.pinAnchor(ref.current, CAT.x - W / 2, CAT.feetY - H);
  }, [scene]);

  useEffect(() => {
    if (!meowing) return;
    const t = window.setTimeout(() => setMeowing(false), MEOW_MS);
    return () => window.clearTimeout(t);
  }, [meowing, pets]);

  useEffect(() => () => window.clearTimeout(travelTimer.current), []);

  const pet = () => {
    setPets((n) => n + 1);
    setMeowing(true);
    if (!allWon) return;
    window.clearTimeout(travelTimer.current);
    if (prefersReducedMotion()) openFastTravel(true);
    else travelTimer.current = window.setTimeout(() => openFastTravel(true), FAST_TRAVEL_DELAY_MS);
  };

  return (
    <div ref={ref} className="anchor" style={{ width: W, height: H, display: scene ? undefined : 'none' }}>
      <div className="cat-overhead">
        {meowing ? (
          <div key={pets} className="cat-pet">
            <span className="cat-heart" aria-hidden="true">
              ♥
            </span>
            <SpeechBubble text={copy.cat.meow} />
          </div>
        ) : (
          allWon && !contactSeen && <QuestMarker />
        )}
      </div>
      <button type="button" className="cat-hit" aria-label={copy.cat.label} onClick={pet} />
    </div>
  );
}
