/** Deterministic rng that cycles through the given values. */
export function seq(...values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

/** rng value that rollDie() turns into face f (1–6). */
export const face = (f: number): number => (f - 0.5) / 6;

/** rng values that rollD20() turns into roll r (1–20). Natural 20 uses the 45% gate. */
export const d20 = (r: number): number[] => (r === 20 ? [0.1] : [0.9, (r - 0.5) / 19]);
