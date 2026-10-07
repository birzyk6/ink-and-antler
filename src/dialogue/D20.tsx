import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useEffect, useId, useRef, useState } from 'react';
import { prefersReducedMotion } from '../engine/motion';

/** Seconds from the throw until the die lands. */
const FALL_S = 0.6;

// Front view of an icosahedron: the outer hexagon, the face toward us (F1–F3), and the nine facets around it.
const T = '50,3';
const UR = '91,27';
const LR = '91,73';
const B = '50,97';
const LL = '9,73';
const UL = '9,27';
const F1 = '50,24';
const F2 = '21,67';
const F3 = '79,67';
const HEX = [T, UR, LR, B, LL, UL].join(' ');
const FRONT = [F1, F2, F3].join(' ');
/** Lit from the top left: `hi` faces the light, `deep` faces away. */
const FACETS: [string, 'hi' | 'mid' | 'lo' | 'deep'][] = [
  [`${T} ${UL} ${F1}`, 'hi'],
  [`${T} ${UR} ${F1}`, 'mid'],
  [`${UL} ${F1} ${F2}`, 'mid'],
  [`${UL} ${LL} ${F2}`, 'lo'],
  [`${UR} ${F1} ${F3}`, 'lo'],
  [`${F2} ${B} ${F3}`, 'lo'],
  [`${UR} ${LR} ${F3}`, 'deep'],
  [`${LL} ${B} ${F2}`, 'deep'],
  [`${LR} ${B} ${F3}`, 'deep'],
];
const CRACK = 'M44 6 49 19 43 30 52 41 46 52 54 63 49 78 53 95M43 30 33 36M52 41 64 45M46 52 37 60';
const SPARKS = 10;

interface Props {
  roll: number;
  modifier: number;
  dc: number;
  success: boolean;
  onSettled: () => void;
}

/** The die itself: a shaded front view of an icosahedron with `face` on the front facet. Decorative. */
export function D20Art({ face, cracked = false }: { face: number; cracked?: boolean }) {
  const sheenId = `d20-sheen-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg className="d20-svg" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {FACETS.map(([points, tone]) => (
        <polygon key={points} className={`d20-facet d20-facet--${tone}`} points={points} />
      ))}
      <polygon className="d20-facet d20-facet--front" points={FRONT} />
      <polygon className="d20-sheen" points={HEX} fill={`url(#${sheenId})`} />
      <polygon className="d20-rim" points={HEX} />
      {cracked && <path className="d20-crack" d={CRACK} pathLength={1} />}
      <text className="d20-face" x="50" y="54" textAnchor="middle" dominantBaseline="middle">
        {face}
      </text>
    </svg>
  );
}

function randomFace(not: number): number {
  return 1 + ((not + Math.floor(Math.random() * 19)) % 20);
}

export function D20({ roll, modifier, dc, success, onSettled }: Props) {
  const [instant] = useState(prefersReducedMotion);
  const [face, setFace] = useState(instant ? roll : 1);
  const [settled, setSettled] = useState(instant);
  const rootRef = useRef<HTMLDivElement>(null);
  const dieRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLSpanElement>(null);
  const firedRef = useRef(false);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  const fire = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    onSettledRef.current();
  };

  useEffect(() => {
    if (instant) fire();
  }, [instant]);

  // The throw: spins in from the upper left, numbers flickering ever slower, then lands with a squash and a hop.
  useGSAP(
    () => {
      if (instant) return;
      const die = dieRef.current;
      const tl = gsap.timeline({
        onComplete: () => {
          setSettled(true);
          fire();
        },
      });
      tl.fromTo(
        die,
        { x: -56, y: -84, rotation: -600, scale: 0.65 },
        { x: 0, y: 0, rotation: 0, scale: 1, duration: FALL_S, ease: 'power2.in' },
      )
        .fromTo(shadowRef.current, { scale: 0.3, opacity: 0.15 }, { scale: 1, opacity: 1, duration: FALL_S, ease: 'power2.in' }, 0)
        .to(die, { scaleX: 1.18, scaleY: 0.8, y: 8, duration: 0.07, ease: 'power1.out' })
        .to(die, { scaleX: 0.95, scaleY: 1.06, y: -12, rotation: 10, duration: 0.12, ease: 'power2.out' })
        .to(die, { scaleX: 1, scaleY: 1, y: 0, rotation: 0, duration: 0.12, ease: 'power2.in' })
        .to(die, { scaleX: 1.06, scaleY: 0.95, y: 2, duration: 0.05 })
        .to(die, { scaleX: 1, scaleY: 1, y: 0, duration: 0.08 });
      let n = 1;
      for (let t = 0, step = 0.045; t < FALL_S - 0.05; t += step, step *= 1.13) {
        n = randomFace(n);
        tl.call(setFace, [n], t);
      }
      tl.call(setFace, [roll], FALL_S);
    },
    { scope: rootRef },
  );

  // The landing flourish: a golden burst for a natural 20, a cracked and dulled die for a natural 1.
  useGSAP(
    () => {
      if (!settled || instant) return;
      const die = dieRef.current;
      gsap.from('.d20-banner', { scale: 0.4, opacity: 0, y: 10, duration: 0.5, ease: 'back.out(2.4)' });
      gsap.from('.d20-math', { opacity: 0, y: 6, duration: 0.3, delay: 0.12, ease: 'power2.out' });
      if (roll === 20) {
        gsap
          .timeline()
          .to(die, { scale: 1.3, duration: 0.15, ease: 'power2.out' })
          .to(die, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
        gsap.fromTo('.d20-burst', { scale: 0.3, opacity: 1 }, { scale: 2.4, opacity: 0, duration: 0.8, ease: 'power2.out' });
        gsap.utils.toArray<HTMLElement>('.d20-spark').forEach((el, i) => {
          const a = (i / SPARKS) * Math.PI * 2 + Math.random() * 0.4;
          const r = 70 + Math.random() * 40;
          gsap.fromTo(
            el,
            { x: 0, y: 0, scale: 0, rotation: 0, opacity: 1 },
            {
              x: Math.cos(a) * r,
              y: Math.sin(a) * r,
              scale: 0.7 + Math.random() * 0.6,
              rotation: 180,
              opacity: 0,
              duration: 0.75 + Math.random() * 0.25,
              ease: 'power3.out',
            },
          );
        });
      } else if (roll === 1) {
        gsap.fromTo('.d20-crack', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.out' });
        gsap
          .timeline()
          .to(die, { keyframes: { x: [0, -8, 7, -5, 4, -2, 0] }, duration: 0.45, ease: 'none' })
          .to(die, { rotation: -7, y: 3, duration: 0.5, ease: 'power2.out' }, 0.2);
      }
    },
    { dependencies: [settled], scope: rootRef },
  );

  const nat = roll === 20 ? 'nat20' : roll === 1 ? 'nat1' : '';
  return (
    <div ref={rootRef} className={`d20${settled ? ` d20--settled ${nat}` : ''}`} role="status">
      <div className="d20-stage">
        {settled && nat === 'nat20' && !instant && <span className="d20-burst" aria-hidden="true" />}
        <span ref={shadowRef} className="d20-shadow" aria-hidden="true" />
        <div ref={dieRef} className="d20-die">
          <D20Art face={face} cracked={settled && nat === 'nat1'} />
        </div>
        {settled &&
          nat === 'nat20' &&
          !instant &&
          Array.from({ length: SPARKS }, (_, i) => <span key={i} className="d20-spark" aria-hidden="true" />)}
      </div>
      {settled && nat === 'nat20' && <div className="d20-banner">NATURAL 20</div>}
      {settled && nat === 'nat1' && <div className="d20-banner d20-banner--bad">NATURAL 1</div>}
      {settled && (
        <p className="d20-math">
          d20 ({roll}){modifier ? ` + ${modifier}` : ''} = {roll + modifier} vs DC {dc}:{' '}
          <strong className={success ? 'ok' : 'bad'}>{success ? 'SUCCESS' : 'FAILURE'}</strong>
        </p>
      )}
    </div>
  );
}
