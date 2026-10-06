import { describe, expect, it } from 'vitest';
import { CENTER_X, ENTER_START_X, PATROL_MIN_X } from '../world/layout';
import {
  ENTER_SPEED, MIN_STEP, createEnteringNpc, createStandingNpc, frameFor, pickTarget, setHold, stepNpc,
} from './patrol';

const still = () => 0.5;

describe('stepNpc', () => {
  it('walks in from the left and holds on arrival', () => {
    let s = stepNpc(createEnteringNpc(), 1000, still, { patrol: false });
    expect(s).toMatchObject({ mode: 'enter', dir: 1 });
    expect(s.x).toBeCloseTo(ENTER_START_X + ENTER_SPEED);
    for (let i = 0; i < 20; i++) s = stepNpc(s, 1000, still, { patrol: false });
    expect(s).toMatchObject({ x: CENTER_X, mode: 'hold' });
  });

  it('idles, then walks to a new target while patrolling', () => {
    let s = stepNpc(createStandingNpc(), 1000, still, { patrol: true });
    expect(s.mode).toBe('idle');
    s = stepNpc(s, 1500, () => 0, { patrol: true });
    expect(s).toMatchObject({ mode: 'walk', targetX: PATROL_MIN_X });
    s = stepNpc(s, 100, still, { patrol: true });
    expect(s.dir).toBe(-1);
  });

  it('stays put when patrol is off', () => {
    const s = stepNpc(createStandingNpc(), 10000, still, { patrol: false });
    expect(s).toMatchObject({ mode: 'idle', x: CENTER_X });
  });
});

describe('helpers', () => {
  it('pickTarget never picks a spot closer than MIN_STEP', () => {
    expect(Math.abs(pickTarget(CENTER_X, still) - CENTER_X)).toBeGreaterThanOrEqual(MIN_STEP);
  });

  it('setHold freezes walkers and the entrance, and releases to idle', () => {
    const walking = { ...createStandingNpc(), mode: 'walk' as const };
    expect(setHold(walking, true).mode).toBe('hold');
    expect(setHold({ ...walking, mode: 'hold' }, false)).toMatchObject({ mode: 'idle', idleLeftMs: 1500 });
    expect(setHold(createEnteringNpc(), true).mode).toBe('hold');
    expect(setHold(createEnteringNpc(), false).mode).toBe('enter');
  });

  it('frameFor uses walk frames while moving and idle frames otherwise', () => {
    expect(frameFor({ ...createEnteringNpc(), animMs: 0 })).toBe(2);
    expect(frameFor({ ...createEnteringNpc(), animMs: 125 })).toBe(3);
    expect(frameFor({ ...createStandingNpc(), animMs: 500 })).toBe(1);
  });
});
