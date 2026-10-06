import { describe, expect, it } from 'vitest';
import { d20, seq } from '../test/rng';
import { CHECKS, applyCheck, modifierFor } from './checks';
import { NAT20_CHANCE, resolveCheck, rollD20 } from './d20';
import { NO_MODS } from './round';

describe('rollD20', () => {
  it('rolls a natural 20 through the weighted gate', () => {
    expect(rollD20(seq(...d20(20)))).toBe(20);
  });

  it('otherwise rolls 1–19', () => {
    expect(rollD20(seq(...d20(1)))).toBe(1);
    expect(rollD20(seq(...d20(19)))).toBe(19);
    expect(rollD20(seq(0.9, 0.999))).toBe(19);
  });

  it('lands on 20 about 45% of the time', () => {
    let twenties = 0;
    for (let i = 0; i < 20000; i++) if (rollD20(Math.random) === 20) twenties++;
    expect(twenties / 20000).toBeGreaterThan(NAT20_CHANCE - 0.03);
    expect(twenties / 20000).toBeLessThan(NAT20_CHANCE + 0.03);
  });
});

describe('resolveCheck', () => {
  it('adds the modifier and compares to DC', () => {
    expect(resolveCheck(15, 3, 12)).toEqual({ roll: 15, modifier: 3, dc: 12, total: 18, success: true, natural: null });
    expect(resolveCheck(10, 0, 12).success).toBe(false);
  });

  it('natural 1 always fails, natural 20 always succeeds', () => {
    expect(resolveCheck(1, 3, 2)).toMatchObject({ success: false, natural: 1 });
    expect(resolveCheck(20, 0, 30)).toMatchObject({ success: true, natural: 20 });
  });
});

describe('modifiers and effects', () => {
  it('origin grants +3 to its ability only', () => {
    expect(modifierFor('CHA', 'CHA')).toBe(3);
    expect(modifierFor('INT', 'CHA')).toBe(0);
    expect(modifierFor(null, 'WIS')).toBe(0);
  });

  it('offers the four tricks from the script with their DCs', () => {
    expect(Object.fromEntries(Object.entries(CHECKS).map(([k, v]) => [k, v.dc]))).toEqual({
      persuasion: 12, investigation: 14, sleight: 15, animal: 8,
    });
  });

  it('applies success effects', () => {
    expect(applyCheck(NO_MODS, 'persuasion', true).extraRerolls).toBe(1);
    expect(applyCheck(NO_MODS, 'investigation', true).plusOneDie).toBe(true);
    expect(applyCheck(NO_MODS, 'sleight', true).setOneSix).toBe(true);
    expect(applyCheck(NO_MODS, 'animal', true).tiesToPlayer).toBe(true);
  });

  it('only a failed switcheroo has a penalty', () => {
    expect(applyCheck(NO_MODS, 'sleight', false).haslinExtraReroll).toBe(true);
    expect(applyCheck(NO_MODS, 'animal', false)).toEqual(NO_MODS);
  });
});
