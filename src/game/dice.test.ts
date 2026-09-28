import { describe, expect, it } from 'vitest';
import { face, seq } from '../test/rng';
import { compareHands, evaluateHand, ossianHolds, rerollUnheld, rollDie } from './dice';

describe('rollDie', () => {
  it('maps rng to faces 1–6', () => {
    expect(rollDie(seq(0))).toBe(1);
    expect(rollDie(seq(0.999))).toBe(6);
    expect(rollDie(seq(face(4)))).toBe(4);
  });
});

describe('evaluateHand', () => {
  it('ranks triple > run > pair > sum', () => {
    expect(evaluateHand([6, 6, 6])).toEqual({ rank: 'triple', score: 306 });
    expect(evaluateHand([3, 1, 2])).toEqual({ rank: 'run', score: 203 });
    expect(evaluateHand([2, 5, 2])).toEqual({ rank: 'pair', score: 125 });
    expect(evaluateHand([1, 3, 6])).toEqual({ rank: 'sum', score: 10 });
    const scores = [[1, 1, 1], [4, 5, 6], [6, 6, 5], [6, 5, 3]].map((d) => evaluateHand(d).score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it('breaks pair ties by pair face, then kicker', () => {
    expect(evaluateHand([5, 5, 1]).score).toBeGreaterThan(evaluateHand([4, 4, 6]).score);
    expect(evaluateHand([4, 4, 6]).score).toBeGreaterThan(evaluateHand([4, 4, 5]).score);
  });
});

describe('compareHands', () => {
  it('higher score wins; ties go to Ossian unless tiesToPlayer', () => {
    expect(compareHands([6, 6, 6], [1, 2, 4], false)).toBe('win');
    expect(compareHands([1, 2, 4], [6, 6, 6], false)).toBe('lose');
    expect(compareHands([1, 3, 6], [6, 3, 1], false)).toBe('lose');
    expect(compareHands([1, 3, 6], [6, 3, 1], true)).toBe('win');
  });
});

describe('ossianHolds', () => {
  it('holds triples and runs whole, pairs only, nothing otherwise', () => {
    expect(ossianHolds([2, 3, 4])).toEqual([true, true, true]);
    expect(ossianHolds([5, 5, 5])).toEqual([true, true, true]);
    expect(ossianHolds([4, 1, 4])).toEqual([true, false, true]);
    expect(ossianHolds([1, 3, 6])).toEqual([false, false, false]);
  });
});

describe('rerollUnheld', () => {
  it('rerolls only unheld dice, in order', () => {
    expect(rerollUnheld([1, 2, 3], [true, false, true], seq(face(6)))).toEqual([1, 6, 3]);
  });
});
