import { describe, expect, it } from 'vitest';
import { mapSize, mapToRuns } from './pixelMap';

describe('mapToRuns', () => {
  it('merges horizontal runs and skips transparent cells', () => {
    expect(mapToRuns(['aab.', '.bbb'], { a: '#a', b: '#b' })).toEqual([
      { x: 0, y: 0, w: 2, color: '#a' },
      { x: 2, y: 0, w: 1, color: '#b' },
      { x: 1, y: 1, w: 3, color: '#b' },
    ]);
  });

  it('throws on unknown keys', () => {
    expect(() => mapToRuns(['.z'], {})).toThrow('Unknown palette key "z" at 1,0');
  });
});

describe('mapSize', () => {
  it('uses the widest row', () => {
    expect(mapSize(['abc', 'ab'])).toEqual({ w: 3, h: 2 });
  });
});
