import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../engine/motion';

const TUMBLE_MS = 900;

interface Props {
  roll: number;
  modifier: number;
  dc: number;
  success: boolean;
  onSettled: () => void;
}

export function D20({ roll, modifier, dc, success, onSettled }: Props) {
  const [instant] = useState(prefersReducedMotion);
  const [face, setFace] = useState(instant ? roll : 1);
  const [settled, setSettled] = useState(instant);
  const dieRef = useRef<HTMLDivElement>(null);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  useEffect(() => {
    if (instant) {
      onSettledRef.current();
      return;
    }
    const flick = window.setInterval(() => setFace(1 + Math.floor(Math.random() * 20)), 70);
    const stop = window.setTimeout(() => {
      window.clearInterval(flick);
      setFace(roll);
      setSettled(true);
      onSettledRef.current();
    }, TUMBLE_MS);
    return () => {
      window.clearInterval(flick);
      window.clearTimeout(stop);
    };
  }, [instant, roll]);

  useGSAP(
    () => {
      if (instant) return;
      if (!settled) {
        gsap.fromTo(dieRef.current, { rotation: 0, y: -40 }, { rotation: 720, y: 0, duration: TUMBLE_MS / 1000, ease: 'bounce.out' });
      } else if (roll === 20) {
        gsap
          .timeline()
          .to(dieRef.current, { scale: 1.5, duration: 0.15, ease: 'power2.out' })
          .to(dieRef.current, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      }
    },
    { dependencies: [settled], scope: dieRef },
  );

  const nat = roll === 20 ? 'nat20' : roll === 1 ? 'nat1' : '';
  return (
    <div className={`d20${settled ? ` d20--settled ${nat}` : ''}`} role="status">
      <div ref={dieRef} className="d20-die">
        <span className="d20-face">{face}</span>
      </div>
      {settled && nat === 'nat20' && <div className="d20-banner">NATURAL 20</div>}
      {settled && nat === 'nat1' && <div className="d20-banner d20-banner--bad">NATURAL 1</div>}
      {settled && (
        <p className="d20-math">
          d20 ({roll}){modifier ? ` + ${modifier}` : ''} = {roll + modifier} vs DC {dc} —{' '}
          <strong className={success ? 'ok' : 'bad'}>{success ? 'SUCCESS' : 'FAILURE'}</strong>
        </p>
      )}
    </div>
  );
}
