import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useRef, useState } from 'react';
import { prefersReducedMotion } from '../engine/motion';

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** Seconds a tumble takes to land, and a flip to turn over. */
export const TUMBLE_S = 0.42;
export const FLIP_S = 0.5;

interface Props {
  value: number;
  label: string;
  hidden?: boolean;
  held?: boolean;
  onClick?: () => void;
  /** How the die arrives when it mounts: thrown in, or turned over from its carved back. */
  entrance?: 'tumble' | 'flip';
  /** Seconds to wait before the entrance, for staggering a row. */
  delay?: number;
  /** Seconds after mounting at which the die pulses as part of a scoring hand. */
  scoreAt?: number;
}

function randomFace(not: number): number {
  return 1 + ((not + Math.floor(Math.random() * 5)) % 6);
}

function BoneFace({ value }: { value: number }) {
  return (
    <span className="die-face die-face--bone" data-value={value}>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={PIPS[value].includes(i) ? 'pip' : 'pip pip--off'} />
      ))}
    </span>
  );
}

/** Haslin's dice: stained wood with an antler rune carved and gilded into the face. */
function RuneFace({ back }: { back?: boolean }) {
  const d = 'M12 21V4.5M12 13 6.5 6.5M12 13l5.5-6.5M9 9.6 5 9M15 9.6l4-.6';
  return (
    <span className={`die-face die-face--rune${back ? ' die-face--back' : ''}`}>
      <svg className="die-rune" viewBox="0 0 24 24">
        <path className="die-rune-groove" d={d} />
        <path className="die-rune-gild" d={d} />
      </svg>
    </span>
  );
}

export function Die({ value, label, hidden, held, onClick, entrance, delay = 0, scoreAt }: Props) {
  const [instant] = useState(prefersReducedMotion);
  const [flicker, setFlicker] = useState<number | null>(null);
  const bodyRef = useRef<HTMLSpanElement>(null);
  const shadowRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const flipping = entrance === 'flip' && !instant;

  // Runs once per mount; a reroll remounts the die (new key) to throw it again.
  useGSAP(() => {
    if (instant) return;
    const body = bodyRef.current;
    const shadow = shadowRef.current;

    if (entrance === 'tumble') {
      const dir = Math.random() < 0.5 ? -1 : 1;
      const tl = gsap.timeline({ delay });
      tl.fromTo(
        body,
        { x: -16 * dir, y: -34, rotation: -320 * dir, rotationX: 55, scale: 0.78, opacity: 0 },
        { x: 0, y: 0, rotation: 0, rotationX: 0, scale: 1, opacity: 1, duration: TUMBLE_S, ease: 'power2.in' },
      )
        .fromTo(shadow, { scale: 0.35, opacity: 0 }, { scale: 1, opacity: 1, duration: TUMBLE_S, ease: 'power2.in' }, 0)
        .to(body, { scaleX: 1.12, scaleY: 0.86, y: 3, duration: 0.06, ease: 'power1.out' })
        .to(body, { scaleX: 1, scaleY: 1, y: 0, duration: 0.34, ease: 'elastic.out(1, 0.45)' })
        .set([body, shadow], { clearProps: 'transform,opacity' });
      if (!hidden) {
        let face = value;
        for (let t = 0; t < TUMBLE_S - 0.04; t += 0.06) {
          face = randomFace(face);
          tl.call(setFlicker, [face], t);
        }
        tl.call(setFlicker, [null], TUMBLE_S);
      }
    } else if (entrance === 'flip') {
      gsap
        .timeline({ delay })
        .fromTo(body, { rotationY: 180 }, { rotationY: 0, duration: FLIP_S, ease: 'back.out(1.4)' })
        .to(body, { y: -10, duration: FLIP_S / 2, ease: 'power2.out', yoyo: true, repeat: 1 }, 0)
        .fromTo(shadow, { scale: 1 }, { scale: 0.75, duration: FLIP_S / 2, yoyo: true, repeat: 1 }, 0)
        .set(body, { clearProps: 'transform' });
    }

    if (scoreAt !== undefined) {
      gsap
        .timeline({ delay: scoreAt })
        .to(body, { scale: 1.16, y: -5, duration: 0.14, ease: 'power2.out' })
        .to(body, { scale: 1, y: 0, duration: 0.45, ease: 'elastic.out(1, 0.5)' })
        .fromTo(glowRef.current, { opacity: 0 }, { opacity: 1, duration: 0.14 }, 0)
        .to(glowRef.current, { opacity: 0.6, duration: 0.6 }, 0.2);
    }
  });

  const cls =
    `die${held ? ' die--held' : ''}${hidden ? ' die--hidden' : ''}` +
    `${instant && scoreAt !== undefined ? ' die--scoring' : ''}`;
  const face = (
    <>
      <span ref={shadowRef} className="die-shadow" aria-hidden="true" />
      <span ref={bodyRef} className="die-body" aria-hidden="true">
        {hidden ? <RuneFace /> : <BoneFace value={flicker ?? value} />}
        {flipping && <RuneFace back />}
        <span ref={glowRef} className="die-glow" />
      </span>
    </>
  );
  return onClick ? (
    <button type="button" className={cls} aria-pressed={held} aria-label={label} onClick={onClick}>
      {face}
    </button>
  ) : (
    <div className={cls} role="img" aria-label={label}>
      {face}
    </div>
  );
}
