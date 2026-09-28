import { compareHands, evaluateHand, ossianHolds, rerollUnheld, rollDice, type Hand, type Rng } from './dice';

export interface RoundMods {
  extraRerolls: number;
  seeOssian: boolean;
  tiesToPlayer: boolean;
  plusOneDie: boolean;
  setOneSix: boolean;
  ossianExtraReroll: boolean;
}

export const NO_MODS: RoundMods = {
  extraRerolls: 0, seeOssian: false, tiesToPlayer: false, plusOneDie: false, setOneSix: false, ossianExtraReroll: false,
};

export interface RoundState {
  ossian: number[];
  player: number[];
  held: boolean[];
  rerollsLeft: number;
  seeOssian: boolean;
  tiesToPlayer: boolean;
  plusOneDie: boolean;
  /** Pity: Pim guarantees the win after two losses in a row. */
  forcedWin: boolean;
}

export interface RoundResult {
  outcome: 'win' | 'lose';
  player: number[];
  ossian: number[];
  playerHand: Hand;
  ossianHand: Hand;
  pim: boolean;
}

/** What Ossian's dice look like after Pim knocks them over. */
export const PIM_OSSIAN_DICE = [1, 2, 4];

function lowestIndex(dice: readonly number[]): number {
  return dice.indexOf(Math.min(...dice));
}

export function startRound(mods: RoundMods, lossStreak: number, rng: Rng): RoundState {
  let ossian = rollDice(3, rng);
  ossian = rerollUnheld(ossian, ossianHolds(ossian), rng);
  if (mods.ossianExtraReroll) ossian = rerollUnheld(ossian, ossianHolds(ossian), rng);
  const player = rollDice(3, rng);
  if (mods.setOneSix) player[lowestIndex(player)] = 6;
  return {
    ossian,
    player,
    held: [false, false, false],
    rerollsLeft: 1 + mods.extraRerolls + (lossStreak === 1 ? 1 : 0),
    seeOssian: mods.seeOssian,
    tiesToPlayer: mods.tiesToPlayer,
    plusOneDie: mods.plusOneDie,
    forcedWin: lossStreak >= 2,
  };
}

export function toggleHold(s: RoundState, i: number): RoundState {
  return { ...s, held: s.held.map((h, j) => (j === i ? !h : h)) };
}

export function rerollPlayer(s: RoundState, rng: Rng): RoundState {
  if (s.rerollsLeft <= 0) return s;
  return { ...s, player: rerollUnheld(s.player, s.held, rng), rerollsLeft: s.rerollsLeft - 1 };
}

export function finishRound(s: RoundState): RoundResult {
  const player = [...s.player];
  if (s.plusOneDie) {
    const i = lowestIndex(player);
    player[i] = Math.min(6, player[i] + 1);
  }
  const outcome = compareHands(player, s.ossian, s.tiesToPlayer);
  if (outcome === 'lose' && s.forcedWin) {
    const ossian = [...PIM_OSSIAN_DICE];
    return { outcome: 'win', player, ossian, playerHand: evaluateHand(player), ossianHand: evaluateHand(ossian), pim: true };
  }
  return { outcome, player, ossian: s.ossian, playerHand: evaluateHand(player), ossianHand: evaluateHand(s.ossian), pim: false };
}
