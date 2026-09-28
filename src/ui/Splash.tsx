import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useRef, useState } from 'react';
import { copy } from '../content/copy';
import './splash.css';

export function Splash({ visible }: { visible: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  useGSAP(
    () => {
      if (visible) return;
      gsap.to(ref.current, { opacity: 0, duration: 0.4, ease: 'steps(4)', onComplete: () => setGone(true) });
    },
    { dependencies: [visible] },
  );
  if (gone) return null;
  return (
    <div ref={ref} className="splash" role="status">
      <div className="splash-d20">20</div>
      <p>{copy.loading}</p>
    </div>
  );
}
