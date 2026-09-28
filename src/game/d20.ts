import type { Rng } from './dice';

/** Rigged on purpose: most players see a natural 20 in their first or second check. */
export const NAT20_CHANCE = 0.45;

export function rollD20(rng: Rng): number {
  if (rng() < NAT20_CHANCE) return 20;
  return 1 + Math.floor(rng() * 19);
}

export interface CheckResult {
  roll: number;
  modifier: number;
  dc: number;
  total: number;
  success: boolean;
  natural: 1 | 20 | null;
}

export function resolveCheck(roll: number, modifier: number, dc: number): CheckResult {
  const total = roll + modifier;
  return {
    roll,
    modifier,
    dc,
    total,
    success: roll === 20 || (roll !== 1 && total >= dc),
    natural: roll === 20 ? 20 : roll === 1 ? 1 : null,
  };
}
