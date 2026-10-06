import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useEffect, useRef, useState } from 'react';
import { copy } from '../content/copy';
import { D20Art } from '../dialogue/D20';
import { prefersReducedMotion } from '../engine/motion';
import '../dialogue/dialogue.css';
import './splash.css';

/** Loading screen: the same d20 as in the game, tumbling while its numbers flicker. */
export function Splash({ visible }: { visible: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const [face, setFace] = useState(20);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t = window.setInterval(() => setFace(1 + Math.floor(Math.random() * 20)), 140);
    return () => window.clearInterval(t);
  }, []);
  useGSAP(
    () => {
      if (visible) return;
      gsap.to(ref.current, { opacity: 0, duration: 0.4, ease: 'power1.out', onComplete: () => setGone(true) });
    },
    { dependencies: [visible] },
  );
  if (gone) return null;
  return (
    <div ref={ref} className="splash" role="status">
      <div className="d20 splash-d20" aria-hidden="true">
        <span className="splash-shadow" />
        <div className="splash-die">
          <D20Art face={face} />
        </div>
      </div>
      <p>{copy.loading}</p>
    </div>
  );
}
