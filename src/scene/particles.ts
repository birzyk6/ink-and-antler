import type { Rng } from '../game/dice';

/** Pure particle model. Positions in world px, velocities in px/s, gravity in px/s². */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  grow: number;
  gravity: number;
  color: number;
  alpha0: number;
}

export interface EmitSpec {
  x: number;
  y: number;
  count: number;
  speed: [number, number];
  /** Radians; 0 = right, -π/2 = up. */
  angle: [number, number];
  life: [number, number];
  size: [number, number];
  /** Size change in px per second. */
  grow: number;
  gravity: number;
  colors: number[];
  alpha: number;
}

const between = (rng: Rng, [a, b]: [number, number]) => a + (b - a) * rng();

export function emit(spec: EmitSpec, rng: Rng): Particle[] {
  return Array.from({ length: spec.count }, () => {
    const speed = between(rng, spec.speed);
    const angle = between(rng, spec.angle);
    const life = between(rng, spec.life);
    return {
      x: spec.x,
      y: spec.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      size: between(rng, spec.size),
      grow: spec.grow,
      gravity: spec.gravity,
      color: spec.colors[Math.floor(rng() * spec.colors.length) % spec.colors.length],
      alpha0: spec.alpha,
    };
  });
}

export function stepParticles(ps: readonly Particle[], dtMs: number): Particle[] {
  const dt = dtMs / 1000;
  const out: Particle[] = [];
  for (const p of ps) {
    const life = p.life - dtMs;
    if (life <= 0) continue;
    out.push({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, vy: p.vy + p.gravity * dt, size: Math.max(1, p.size + p.grow * dt), life });
  }
  return out;
}

export function particleAlpha(p: Particle): number {
  return p.alpha0 * (p.life / p.maxLife);
}

const UP = -Math.PI / 2;

export const SPARKS = (x: number, y: number): EmitSpec => ({
  x, y, count: 18, speed: [80, 220], angle: [UP - 1.1, UP + 1.1], life: [300, 700],
  size: [3, 6], grow: -4, gravity: 420, colors: [0xfff3a0, 0xffb52e, 0xe0561b], alpha: 1,
});

export const EMBERS = (x: number, y: number): EmitSpec => ({
  x, y, count: 1, speed: [20, 50], angle: [UP - 0.4, UP + 0.4], life: [800, 1600],
  size: [3, 4], grow: -1.5, gravity: -10, colors: [0xffb52e, 0xe0561b], alpha: 0.9,
});

export const SMOKE = (x: number, y: number): EmitSpec => ({
  x, y, count: 1, speed: [15, 30], angle: [UP - 0.2, UP + 0.35], life: [2500, 3800],
  size: [8, 12], grow: 10, gravity: -4, colors: [0xdcdce1, 0xc4c4cc], alpha: 0.5,
});

export const GOLD_BURST = (x: number, y: number): EmitSpec => ({
  x, y, count: 90, speed: [150, 480], angle: [0, Math.PI * 2], life: [700, 1500],
  size: [4, 9], grow: -3, gravity: 380, colors: [0xe8b04a, 0xfff3a0, 0xffffff, 0xa8741e], alpha: 1,
});
