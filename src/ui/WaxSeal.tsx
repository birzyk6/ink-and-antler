import { useId } from 'react';
import type { ItemId } from '../game/items';
import { VARIANTS } from './ScrollIcon';

const SIZE = 84;
const C = SIZE / 2;

/** Lumpy wax edge: a circle with a deterministic wobble so it looks poured, not stamped. */
const EDGE = Array.from({ length: 28 }, (_, i) => {
  const a = (i / 28) * Math.PI * 2;
  const r = 38 + Math.sin(i * 2.7) * 1.8 + Math.cos(i * 1.3) * 1.2;
  return `${(C + Math.cos(a) * r).toFixed(1)},${(C + Math.sin(a) * r).toFixed(1)}`;
}).join(' ');

/** The jagged line the seal splits along, top to bottom. */
const CRACK = [
  [44, 0], [40, 14], [48, 26], [38, 40], [47, 52], [39, 66], [43, SIZE],
] as const;
const crackPath = CRACK.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
const half = (side: 0 | typeof SIZE) =>
  [`${side},0`, ...CRACK.map(([x, y]) => `${x},${y}`), `${side},${SIZE}`].join(' ');

/** Wax seal drawn as two halves, so the viewer can crack it open. */
export function WaxSeal({ id }: { id: ItemId }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [light, dark] = VARIANTS[id].seal;
  const face = (
    <>
      <polygon points={EDGE} fill={`url(#${uid}-wax)`} stroke="#2b1a10" strokeWidth="2" />
      <circle cx={C} cy={C} r="27" fill="none" stroke={dark} strokeWidth="3" opacity="0.8" />
      <circle cx={C} cy={C} r="27" fill="none" stroke="rgb(255 255 255 / 0.35)" strokeWidth="1" transform="translate(-1 -1)" />
      {/* Embossed antlers. */}
      <path
        d={`M${C} 58 V40 M${C} 44 C${C - 8} 40 ${C - 14} 34 ${C - 14} 24 M${C - 10} 34 L${C - 18} 30 M${C - 12} 28 L${C - 8} 22
            M${C} 44 C${C + 8} 40 ${C + 14} 34 ${C + 14} 24 M${C + 10} 34 L${C + 18} 30 M${C + 12} 28 L${C + 8} 22`}
        fill="none"
        stroke={dark}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <ellipse cx={C - 12} cy={C - 16} rx="9" ry="5" fill="rgb(255 255 255 / 0.3)" transform={`rotate(-30 ${C - 12} ${C - 16})`} />
    </>
  );
  return (
    <svg className="wax-seal" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`${uid}-wax`} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </radialGradient>
        <clipPath id={`${uid}-l`}>
          <polygon points={half(0)} />
        </clipPath>
        <clipPath id={`${uid}-r`}>
          <polygon points={half(SIZE)} />
        </clipPath>
      </defs>
      <g className="wax-half wax-half--left" clipPath={`url(#${uid}-l)`}>
        {face}
      </g>
      <g className="wax-half wax-half--right" clipPath={`url(#${uid}-r)`}>
        {face}
      </g>
      <path className="wax-crack" d={crackPath} fill="none" stroke="#1b1210" strokeWidth="2.5" strokeLinejoin="bevel" pathLength={1} />
    </svg>
  );
}
