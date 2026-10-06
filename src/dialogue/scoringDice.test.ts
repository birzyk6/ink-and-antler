import { describe, expect, it } from 'vitest';
import { evaluateHand } from '../game/dice';
import { scoringDice } from './scoringDice';

const marks = (...dice: number[]) => scoringDice(dice, evaluateHand(dice).rank);

describe('scoringDice', () => {
  it.each([
    ['five', [4, 4, 4, 4, 4], [true, true, true, true, true]],
    ['four', [2, 5, 5, 5, 5], [false, true, true, true, true]],
    ['full house', [3, 6, 3, 6, 3], [true, true, true, true, true]],
    ['straight', [5, 1, 3, 2, 4], [true, true, true, true, true]],
    ['three', [6, 1, 6, 2, 6], [true, false, true, false, true]],
    ['two pairs', [2, 4, 2, 4, 5], [true, true, true, true, false]],
    ['pair', [1, 3, 5, 3, 6], [false, true, false, true, false]],
    ['sum', [1, 2, 3, 4, 6], [false, false, false, false, false]],
  ])('%s', (_, dice, expected) => {
    expect(marks(...dice)).toEqual(expected);
  });
});
