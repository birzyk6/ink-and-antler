import { describe, expect, it } from 'vitest';
import { DUSK, IDENTITY, lerpMatrix } from './colorMatrix';

describe('lerpMatrix', () => {
  it('returns the endpoints at 0 and 1', () => {
    expect(lerpMatrix(IDENTITY, DUSK, 0)).toEqual(IDENTITY);
    expect(lerpMatrix(IDENTITY, DUSK, 1)).toEqual(DUSK);
  });

  it('blends element-wise', () => {
    expect(lerpMatrix(IDENTITY, DUSK, 0.5)[0]).toBeCloseTo((IDENTITY[0] + DUSK[0]) / 2);
    expect(lerpMatrix(IDENTITY, DUSK, 0.5)).toHaveLength(20);
  });
});
