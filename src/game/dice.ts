export type Rng = () => number;
export type HandRank = 'triple' | 'run' | 'pair' | 'sum';
export interface Hand {
  rank: HandRank;
  /** Comparable across ranks: triple 3xx > run 2xx > pair 1xx > sum (3–18). */
  score: number;
}

export function rollDie(rng: Rng): number {
  return 1 + Math.floor(rng() * 6);
}

export function rollDice(n: number, rng: Rng): number[] {
  return Array.from({ length: n }, () => rollDie(rng));
}

export function evaluateHand(dice: readonly number[]): Hand {
  const [a, b, c] = [...dice].sort((x, y) => x - y);
  if (a === c) return { rank: 'triple', score: 300 + a };
  if (b === a + 1 && c === b + 1) return { rank: 'run', score: 200 + c };
  if (a === b || b === c) {
    const kicker = a === b ? c : a;
    return { rank: 'pair', score: 100 + b * 10 + kicker };
  }
  return { rank: 'sum', score: a + b + c };
}

export function compareHands(player: readonly number[], ossian: readonly number[], tiesToPlayer: boolean): 'win' | 'lose' {
  const p = evaluateHand(player).score;
  const o = evaluateHand(ossian).score;
  if (p === o) return tiesToPlayer ? 'win' : 'lose';
  return p > o ? 'win' : 'lose';
}

/** Ossian keeps anything that already scores and rerolls the rest. */
export function ossianHolds(dice: readonly number[]): boolean[] {
  const hand = evaluateHand(dice);
  if (hand.rank === 'triple' || hand.rank === 'run') return dice.map(() => true);
  if (hand.rank === 'pair') {
    const pairFace = Math.floor((hand.score - 100) / 10);
    return dice.map((d) => d === pairFace);
  }
  return dice.map(() => false);
}

export function rerollUnheld(dice: readonly number[], held: readonly boolean[], rng: Rng): number[] {
  return dice.map((d, i) => (held[i] ? d : rollDie(rng)));
}
