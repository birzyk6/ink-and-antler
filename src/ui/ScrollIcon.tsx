import { useId } from 'react';
import type { ItemId } from '../game/items';

/** Ribbon and seal colours per scroll: the CV is red and gold, the letter blue and red. */
export const VARIANTS: Record<ItemId, { ribbon: [string, string]; seal: [string, string] }> = {
  cv: { ribbon: ['#c8443a', '#6e1a12'], seal: ['#f4cc62', '#94640f'] },
  letter: { ribbon: ['#4a7fc4', '#1d3a63'], seal: ['#c23a2c', '#5e0f0b'] },
};

const INK = '#4a2e14';

/** Painterly rolled-parchment icon in the spirit of BG3's inventory scrolls. Decorative. */
export function ScrollIcon({ id, size = 52 }: { id: ItemId; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const v = VARIANTS[id];
  const url = (name: string) => `url(#${uid}-${name})`;
  return (
    <svg className="scroll-icon" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ imageRendering: 'auto' }}>
      <defs>
        <linearGradient id={`${uid}-paper`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdf3d6" />
          <stop offset="0.5" stopColor="#e8d09a" />
          <stop offset="1" stopColor="#b48d55" />
        </linearGradient>
        <linearGradient id={`${uid}-end`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c9a66a" />
          <stop offset="0.6" stopColor="#f3e2b4" />
          <stop offset="1" stopColor="#a8824a" />
        </linearGradient>
        <linearGradient id={`${uid}-ribbon`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={v.ribbon[1]} />
          <stop offset="0.45" stopColor={v.ribbon[0]} />
          <stop offset="1" stopColor={v.ribbon[1]} />
        </linearGradient>
        <radialGradient id={`${uid}-seal`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor={v.seal[0]} />
          <stop offset="1" stopColor={v.seal[1]} />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="52" rx="22" ry="4" fill="rgb(0 0 0 / 0.4)" />
      <g transform="rotate(-32 32 32)">
        <rect x="9" y="23" width="46" height="17" rx="2" fill={url('paper')} stroke={INK} strokeWidth="1.4" />
        <path d="M13 27.5 H51 M13 35.5 H51" stroke="rgb(110 70 30 / 0.3)" strokeWidth="1" />
        <path d="M12 25 H52" stroke="rgb(255 255 255 / 0.6)" strokeWidth="1.2" strokeLinecap="round" />
        <ellipse cx="9" cy="31.5" rx="3.6" ry="8.5" fill={url('end')} stroke={INK} strokeWidth="1.4" />
        <ellipse cx="9" cy="31.5" rx="1.4" ry="4" fill="none" stroke="#8a6434" strokeWidth="1" />
        <ellipse cx="55" cy="31.5" rx="3.6" ry="8.5" fill={url('end')} stroke={INK} strokeWidth="1.4" />
        <ellipse cx="55" cy="31.5" rx="1.4" ry="4" fill="none" stroke="#8a6434" strokeWidth="1" />
        <path d="M29.5 39 L26 50 L28.8 48.6 L30.6 51.5 L32 40 Z" fill={url('ribbon')} stroke={INK} strokeWidth="0.9" />
        <path d="M34.5 39 L38 50 L35.2 48.6 L33.4 51.5 L32 40 Z" fill={url('ribbon')} stroke={INK} strokeWidth="0.9" />
        <rect x="29" y="22" width="6" height="19" fill={url('ribbon')} stroke={INK} strokeWidth="1" />
        <circle cx="32" cy="31.5" r="5.2" fill={url('seal')} stroke={INK} strokeWidth="1" />
        <circle cx="32" cy="31.5" r="2.6" fill="none" stroke="rgb(0 0 0 / 0.35)" strokeWidth="0.9" />
        <circle cx="30.4" cy="29.8" r="1.1" fill="rgb(255 255 255 / 0.55)" />
      </g>
    </svg>
  );
}
