import type { Rng } from '../game/dice';
import { CENTER_X, ENTER_START_X, PATROL_MAX_X, PATROL_MIN_X } from '../world/layout';
import { IDLE_FRAMES, WALK_FRAMES } from './druidSheet';

export type NpcMode = 'enter' | 'walk' | 'idle' | 'hold';

export interface NpcState {
  x: number;
  dir: 1 | -1;
  mode: NpcMode;
  targetX: number;
  idleLeftMs: number;
  animMs: number;
}

/** World px per second. The entrance is brisk so nobody waits for him. */
export const ENTER_SPEED = 220;
export const WALK_SPEED = 90;
export const MIN_STEP = 160;
const WALK_FRAME_MS = 125;
const IDLE_FRAME_MS = 500;

export function createEnteringNpc(): NpcState {
  return { x: ENTER_START_X, dir: 1, mode: 'enter', targetX: CENTER_X, idleLeftMs: 0, animMs: 0 };
}

export function createStandingNpc(): NpcState {
  return { x: CENTER_X, dir: 1, mode: 'idle', targetX: CENTER_X, idleLeftMs: 2000, animMs: 0 };
}

export function setHold(s: NpcState, hold: boolean): NpcState {
  if (hold && (s.mode === 'walk' || s.mode === 'idle')) return { ...s, mode: 'hold' };
  if (!hold && s.mode === 'hold') return { ...s, mode: 'idle', idleLeftMs: 1500 };
  return s;
}

export function pickTarget(x: number, rng: Rng): number {
  const t = PATROL_MIN_X + rng() * (PATROL_MAX_X - PATROL_MIN_X);
  if (Math.abs(t - x) >= MIN_STEP) return t;
  return x < (PATROL_MIN_X + PATROL_MAX_X) / 2
    ? Math.min(PATROL_MAX_X, x + MIN_STEP * 2)
    : Math.max(PATROL_MIN_X, x - MIN_STEP * 2);
}

export function stepNpc(s: NpcState, dtMs: number, rng: Rng, opts: { patrol: boolean }): NpcState {
  const animMs = s.animMs + dtMs;
  if (s.mode === 'enter' || s.mode === 'walk') {
    const delta = s.targetX - s.x;
    const stepPx = ((s.mode === 'enter' ? ENTER_SPEED : WALK_SPEED) * dtMs) / 1000;
    const dir: 1 | -1 = delta >= 0 ? 1 : -1;
    if (Math.abs(delta) <= stepPx) {
      return s.mode === 'enter'
        ? { ...s, x: s.targetX, dir, mode: 'hold', animMs }
        : { ...s, x: s.targetX, dir, mode: 'idle', idleLeftMs: 2000 + rng() * 3000, animMs };
    }
    return { ...s, x: s.x + dir * stepPx, dir, animMs };
  }
  if (s.mode === 'idle' && opts.patrol) {
    const idleLeftMs = s.idleLeftMs - dtMs;
    if (idleLeftMs <= 0) return { ...s, mode: 'walk', targetX: pickTarget(s.x, rng), idleLeftMs: 0, animMs };
    return { ...s, idleLeftMs, animMs };
  }
  return { ...s, animMs };
}

export function frameFor(s: NpcState): number {
  if (s.mode === 'enter' || s.mode === 'walk') return WALK_FRAMES[Math.floor(s.animMs / WALK_FRAME_MS) % WALK_FRAMES.length];
  return IDLE_FRAMES[Math.floor(s.animMs / IDLE_FRAME_MS) % IDLE_FRAMES.length];
}
