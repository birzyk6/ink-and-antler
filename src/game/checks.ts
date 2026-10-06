import type { RoundMods } from './round';

export type Ability = 'CHA' | 'INT' | 'DEX' | 'WIS';
export const ABILITIES: readonly Ability[] = ['CHA', 'INT', 'DEX', 'WIS'];

export type CheckId = 'persuasion' | 'investigation' | 'sleight' | 'animal';

export interface CheckDef {
  ability: Ability;
  skill: string;
  dc: number;
}

export const CHECKS: Record<CheckId, CheckDef> = {
  persuasion: { ability: 'CHA', skill: 'Persuasion', dc: 12 },
  investigation: { ability: 'INT', skill: 'Investigation', dc: 14 },
  sleight: { ability: 'DEX', skill: 'Sleight of Hand', dc: 15 },
  animal: { ability: 'WIS', skill: 'Animal Handling', dc: 8 },
};

export const CHECK_ORDER: readonly CheckId[] = ['persuasion', 'investigation', 'sleight', 'animal'];

export const ORIGIN_BONUS = 3;

export function modifierFor(origin: Ability | null, ability: Ability): number {
  return origin === ability ? ORIGIN_BONUS : 0;
}

export function applyCheck(mods: RoundMods, id: CheckId, success: boolean): RoundMods {
  if (!success) return id === 'sleight' ? { ...mods, haslinExtraReroll: true } : mods;
  switch (id) {
    case 'persuasion':
      return { ...mods, extraRerolls: mods.extraRerolls + 1 };
    case 'investigation':
      return { ...mods, plusOneDie: true };
    case 'sleight':
      return { ...mods, setOneSix: true };
    case 'animal':
      return { ...mods, tiesToPlayer: true };
  }
}
