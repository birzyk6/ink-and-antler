import { describe, expect, it } from 'vitest';
import { anchorTransform, computeStageTransform } from './stageTransform';

describe('computeStageTransform', () => {
  it('fits a 16:9 viewport exactly', () => {
    expect(computeStageTransform(1920, 1080)).toEqual({ scale: 1, offsetX: 0, offsetY: 0 });
  });

  it('crops at most 20% horizontally on 4:3, then letterboxes', () => {
    const t = computeStageTransform(1440, 1080);
    expect(t.scale).toBeCloseTo(0.9375);
    expect(t.offsetX).toBeCloseTo(-180);
    expect(t.offsetY).toBeCloseTo(33.75);
  });

  it('crops at most 15% vertically on 21:9, then pillarboxes', () => {
    const t = computeStageTransform(2560, 1080);
    expect(t.scale).toBeCloseTo(1.17647, 4);
    expect(t.offsetX).toBeCloseTo(150.59, 1);
    expect(t.offsetY).toBeCloseTo(-95.29, 1);
  });
});

describe('anchorTransform', () => {
  it('maps a world point to a screen translate + scale', () => {
    expect(anchorTransform({ scale: 0.5, offsetX: 10, offsetY: 20 }, 100, 200)).toBe('translate(60px, 120px) scale(0.5)');
  });
});
