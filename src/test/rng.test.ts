import { describe, expect, it } from 'vitest';
import { d20, face, seq } from './rng';

describe('test rng helpers', () => {
  it('seq cycles through its values', () => {
    const rng = seq(0.1, 0.2);
    expect([rng(), rng(), rng()]).toEqual([0.1, 0.2, 0.1]);
  });

  it('face(f) maps to die face f', () => {
    for (let f = 1; f <= 6; f++) expect(1 + Math.floor(face(f) * 6)).toBe(f);
  });

  it('d20(r) yields values that pick roll r', () => {
    expect(d20(20)).toEqual([0.1]);
    for (let r = 1; r <= 19; r++) {
      const [gate, pick] = d20(r);
      expect(gate).toBeGreaterThanOrEqual(0.45);
      expect(1 + Math.floor(pick * 19)).toBe(r);
    }
  });
});
