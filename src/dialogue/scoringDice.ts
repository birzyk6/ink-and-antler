import type { HandRank } from '../game/dice';

/**
 * Which dice make up a hand of the given rank: every die of a straight, none for a plain sum,
 * otherwise each die whose face repeats (the pairs, three, four, five or full house).
 */
export function scoringDice(dice: readonly number[], rank: HandRank): boolean[] {
  if (rank === 'sum') return dice.map(() => false);
  if (rank === 'straight') return dice.map(() => true);
  return dice.map((d) => dice.filter((x) => x === d).length > 1);
}
