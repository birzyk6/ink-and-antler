export type Rng = () => number;
export type HandRank = 'five' | 'four' | 'fullHouse' | 'straight' | 'three' | 'twoPairs' | 'pair' | 'sum';
export type Outcome = 'win' | 'lose' | 'tie';

export const DICE_COUNT = 5;

/** Low to high. */
const RANK_ORDER: readonly HandRank[] = ['sum', 'pair', 'twoPairs', 'three', 'straight', 'fullHouse', 'four', 'five'];

export interface Hand {
  rank: HandRank;
  /** Compared left to right: rank tier, the rank's faces (high first), then the total. */
  key: number[];
}

export function rollDie(rng: Rng): number {
  return 1 + Math.floor(rng() * 6);
}

export function rollDice(n: number, rng: Rng): number[] {
  return Array.from({ length: n }, () => rollDie(rng));
}

/** [face, count] pairs, most frequent first, then highest face first. */
function groups(dice: readonly number[]): [number, number][] {
  const counts = new Map<number, number>();
  for (const d of dice) counts.set(d, (counts.get(d) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
}

function rankOf(dice: readonly number[]): { rank: HandRank; faces: number[] } {
  const g = groups(dice);
  const [f1, c1] = g[0];
  const [f2, c2] = g[1] ?? [0, 0];
  const high = Math.max(...dice);
  if (c1 === 5) return { rank: 'five', faces: [f1] };
  if (c1 === 4) return { rank: 'four', faces: [f1] };
  if (c1 === 3 && c2 === 2) return { rank: 'fullHouse', faces: [f1, f2] };
  if (g.length === dice.length && high - Math.min(...dice) === dice.length - 1) return { rank: 'straight', faces: [high] };
  if (c1 === 3) return { rank: 'three', faces: [f1] };
  if (c1 === 2 && c2 === 2) return { rank: 'twoPairs', faces: [f1, f2] };
  if (c1 === 2) return { rank: 'pair', faces: [f1] };
  return { rank: 'sum', faces: [] };
}

export function evaluateHand(dice: readonly number[]): Hand {
  const { rank, faces } = rankOf(dice);
  const total = dice.reduce((a, b) => a + b, 0);
  return { rank, key: [RANK_ORDER.indexOf(rank), ...faces, total] };
}

export function compareHands(player: readonly number[], haslin: readonly number[]): Outcome {
  const p = evaluateHand(player).key;
  const h = evaluateHand(haslin).key;
  for (let i = 0; i < Math.max(p.length, h.length); i++) {
    const d = (p[i] ?? 0) - (h[i] ?? 0);
    if (d !== 0) return d > 0 ? 'win' : 'lose';
  }
  return 'tie';
}

/** Haslin keeps made hands whole, otherwise every face that appears twice or more. */
export function haslinHolds(dice: readonly number[]): boolean[] {
  const { rank } = rankOf(dice);
  if (rank === 'five' || rank === 'fullHouse' || rank === 'straight') return dice.map(() => true);
  return dice.map((d) => dice.filter((x) => x === d).length >= 2);
}

export function rerollUnheld(dice: readonly number[], held: readonly boolean[], rng: Rng): number[] {
  return dice.map((d, i) => (held[i] ? d : rollDie(rng)));
}
