import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useEffect, useRef } from 'react';
import { copy, items } from '../content/copy';
import { prefersReducedMotion } from '../engine/motion';
import { useGame } from '../game/store';
import { ScrollIcon } from './ScrollIcon';
import './ui.css';

const RECEIVE_MS = 2200;

export function ReceiveFx() {
  const id = useGame((s) => s.justReceived[0]);
  const ack = useGame((s) => s.ackReceived);
  const flyRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const t = window.setTimeout(ack, RECEIVE_MS);
    return () => window.clearTimeout(t);
  }, [id, ack]);

  useGSAP(
    () => {
      if (!id || !flyRef.current || !toastRef.current) return;
      if (prefersReducedMotion()) {
        gsap.set(flyRef.current, { opacity: 0 });
        return;
      }
      const target = document.getElementById('satchel-button')?.getBoundingClientRect();
      const toX = target ? target.left + target.width / 2 : window.innerWidth - 56;
      const toY = target ? target.top + target.height / 2 : window.innerHeight / 2;
      const fromX = window.innerWidth / 2;
      const fromY = window.innerHeight * 0.45;
      gsap
        .timeline()
        .set(flyRef.current, { x: fromX, y: fromY, xPercent: -50, yPercent: -50, scale: 2.5, opacity: 1 })
        .to(flyRef.current, { x: (fromX + toX) / 2, y: fromY - 160, scale: 2, duration: 0.45, ease: 'power2.out' })
        .to(flyRef.current, { x: toX, y: toY, scale: 0.8, duration: 0.45, ease: 'power2.in' })
        .to(flyRef.current, { opacity: 0, duration: 0.15 });
      gsap
        .timeline()
        .fromTo(toastRef.current, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'back.out(2)' })
        .to(toastRef.current, { opacity: 0, duration: 0.3, delay: 1.5 });
    },
    { dependencies: [id] },
  );

  if (!id) return null;
  return (
    <>
      <div key={`fly-${id}`} ref={flyRef} className="fly" aria-hidden="true">
        <ScrollIcon id={id} size={64} />
      </div>
      <div key={`toast-${id}`} ref={toastRef} className="toast px-parchment" role="status">
        {copy.received(items[id].name)}
      </div>
    </>
  );
}
