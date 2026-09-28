import { describe, expect, it } from 'vitest';
import { seq } from '../test/rng';
import { emit, particleAlpha, stepParticles, type EmitSpec } from './particles';

const spec: EmitSpec = {
  x: 100, y: 200, count: 5, speed: [100, 100], angle: [0, 0], life: [1000, 1000],
  size: [4, 4], grow: 0, gravity: 0, colors: [0xffffff], alpha: 1,
};

describe('emit', () => {
  it('creates count particles at the origin within the ranges', () => {
    const ps = emit(spec, seq(0.5));
    expect(ps).toHaveLength(5);
    expect(ps[0]).toMatchObject({ x: 100, y: 200, vx: 100, vy: 0, life: 1000, maxLife: 1000, size: 4 });
  });
});

describe('stepParticles', () => {
  it('moves by velocity, applies gravity, ages and removes the dead', () => {
    const [p] = emit({ ...spec, count: 1, gravity: 100 }, seq(0.5));
    const [q] = stepParticles([p], 500);
    expect(q.x).toBeCloseTo(150);
    expect(q.vy).toBeCloseTo(50);
    expect(q.life).toBe(500);
    expect(particleAlpha(q)).toBeCloseTo(0.5);
    expect(stepParticles([q], 600)).toHaveLength(0);
  });
});
