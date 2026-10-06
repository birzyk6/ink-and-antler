import { describe, expect, it } from 'vitest';
import { face, faces, seq } from '../test/rng';
import { compareHands, evaluateHand, haslinHolds, rerollUnheld, rollDie } from './dice';

describe('rollDie', () => {
  it('maps rng to faces 1–6', () => {
    expect(rollDie(seq(0))).toBe(1);
    expect(rollDie(seq(0.999))).toBe(6);
    expect(rollDie(seq(face(4)))).toBe(4);
  });
});

const LADDER = [
  [[6, 6, 6, 6, 6], 'five'],
  [[2, 2, 5, 2, 2], 'four'],
  [[3, 5, 3, 5, 3], 'fullHouse'],
  [[6, 2, 4, 3, 5], 'straight'],
  [[4, 1, 4, 2, 4], 'three'],
  [[5, 2, 5, 2, 1], 'twoPairs'],
  [[3, 1, 3, 5, 6], 'pair'],
  [[1, 2, 3, 4, 6], 'sum'],
] as const;

describe('evaluateHand', () => {
  it.each(LADDER)('%j is %s', (dice, rank) => {
    expect(evaluateHand(dice).rank).toBe(rank);
  });

  it('each rank beats every rank below it', () => {
    for (let i = 0; i < LADDER.length - 1; i++) {
      expect(compareHands(LADDER[i][0], LADDER[i + 1][0])).toBe('win');
      expect(compareHands(LADDER[i + 1][0], LADDER[i][0])).toBe('lose');
    }
  });

  it('1–5 is a straight too, but 2–6 beats it', () => {
    expect(evaluateHand([1, 2, 3, 4, 5]).rank).toBe('straight');
    expect(compareHands([2, 3, 4, 5, 6], [1, 2, 3, 4, 5])).toBe('win');
  });
});

describe('compareHands within a rank', () => {
  it('compares the rank faces first, high first', () => {
    expect(compareHands([5, 5, 1, 2, 3], [4, 4, 6, 5, 3])).toBe('win');
    expect(compareHands([2, 2, 2, 6, 6], [3, 3, 3, 1, 1])).toBe('lose');
    expect(compareHands([6, 6, 1, 1, 2], [5, 5, 4, 4, 3])).toBe('win');
  });

  it('then the total', () => {
    expect(compareHands([3, 3, 6, 5, 2], [3, 3, 1, 2, 4])).toBe('win');
  });

  it('only the sum: the higher sum wins', () => {
    expect(compareHands([1, 2, 3, 5, 6], [1, 2, 3, 4, 6])).toBe('win');
    expect(compareHands([1, 2, 3, 4, 6], [1, 3, 4, 5, 6])).toBe('lose');
  });

  it('equal hands are a proper tie', () => {
    expect(compareHands([1, 2, 3, 4, 6], [6, 4, 3, 2, 1])).toBe('tie');
    expect(compareHands([3, 3, 1, 5, 6], [3, 3, 6, 5, 1])).toBe('tie');
  });
});

describe('haslinHolds', () => {
  it('keeps made hands whole', () => {
    expect(haslinHolds([6, 6, 6, 6, 6])).toEqual([true, true, true, true, true]);
    expect(haslinHolds([3, 5, 3, 5, 3])).toEqual([true, true, true, true, true]);
    expect(haslinHolds([6, 2, 4, 3, 5])).toEqual([true, true, true, true, true]);
  });

  it('otherwise keeps faces that appear twice or more', () => {
    expect(haslinHolds([2, 2, 5, 2, 2])).toEqual([true, true, false, true, true]);
    expect(haslinHolds([5, 2, 5, 2, 1])).toEqual([true, true, true, true, false]);
    expect(haslinHolds([3, 1, 3, 5, 6])).toEqual([true, false, true, false, false]);
    expect(haslinHolds([1, 2, 3, 4, 6])).toEqual([false, false, false, false, false]);
    expect(haslinHolds([4, 1, 4, 2, 4])).toEqual([true, false, true, false, true]);
  });
});

describe('rerollUnheld', () => {
  it('rerolls only unheld dice, in order', () => {
    expect(rerollUnheld([1, 2, 3, 4, 5], [true, false, true, true, false], seq(face(6)))).toEqual([1, 6, 3, 4, 6]);
  });
});
