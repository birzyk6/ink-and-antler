import { DICE_COUNT, compareHands, evaluateHand, haslinHolds, rerollUnheld, rollDice, type Hand, type Outcome, type Rng } from './dice';

export interface RoundMods {
  extraRerolls: number;
  tiesToPlayer: boolean;
  plusOneDie: boolean;
  setOneSix: boolean;
  haslinExtraReroll: boolean;
  /** Natural 20 or pity: the player is dealt a winning hand. */
  rigged: boolean;
}

export const NO_MODS: RoundMods = {
  extraRerolls: 0, tiesToPlayer: false, plusOneDie: false, setOneSix: false, haslinExtraReroll: false, rigged: false,
};

export const BASE_REROLLS = 1;

export interface RoundState {
  haslin: number[];
  player: number[];
  held: boolean[];
  rerollsLeft: number;
  tiesToPlayer: boolean;
  plusOneDie: boolean;
  rigged: boolean;
}

export interface RoundResult {
  outcome: Outcome;
  /** Erl turned a tie into a win. */
  erl: boolean;
  player: number[];
  haslin: number[];
  playerHand: Hand;
  haslinHand: Hand;
}

/** The lowest hand there is; Haslin "rolled" it when a rigged game could not be won fairly. */
export const RIGGED_HASLIN_DICE = [1, 2, 3, 4, 6];
const RIG_TRIES = 200;

function lowestIndex(dice: readonly number[]): number {
  return dice.indexOf(Math.min(...dice));
}

/** The player's dice as they are scored at the reveal. */
function scored(player: readonly number[], plusOneDie: boolean): number[] {
  const out = [...player];
  if (plusOneDie) {
    const i = lowestIndex(out);
    out[i] = Math.min(6, out[i] + 1);
  }
  return out;
}

/** Draws until the hand beats Haslin; keeps the best draw if none does. */
function drawWinning(draw: () => number[], haslin: readonly number[], plusOneDie: boolean): number[] {
  let best = draw();
  for (let i = 1; i < RIG_TRIES && compareHands(scored(best, plusOneDie), haslin) !== 'win'; i++) {
    const next = draw();
    if (compareHands(scored(next, plusOneDie), scored(best, plusOneDie)) === 'win') best = next;
  }
  return best;
}

export function startRound(mods: RoundMods, rng: Rng): RoundState {
  let haslin = rollDice(DICE_COUNT, rng);
  haslin = rerollUnheld(haslin, haslinHolds(haslin), rng);
  if (mods.haslinExtraReroll) haslin = rerollUnheld(haslin, haslinHolds(haslin), rng);
  const draw = () => {
    const p = rollDice(DICE_COUNT, rng);
    if (mods.setOneSix) p[lowestIndex(p)] = 6;
    return p;
  };
  return {
    haslin,
    player: mods.rigged ? drawWinning(draw, haslin, mods.plusOneDie) : draw(),
    held: Array.from({ length: DICE_COUNT }, () => false),
    rerollsLeft: BASE_REROLLS + mods.extraRerolls,
    tiesToPlayer: mods.tiesToPlayer,
    plusOneDie: mods.plusOneDie,
    rigged: mods.rigged,
  };
}

export function toggleHold(s: RoundState, i: number): RoundState {
  return { ...s, held: s.held.map((h, j) => (j === i ? !h : h)) };
}

export function rerollPlayer(s: RoundState, rng: Rng): RoundState {
  if (s.rerollsLeft <= 0) return s;
  const draw = () => rerollUnheld(s.player, s.held, rng);
  const player = s.rigged ? drawWinning(draw, s.haslin, s.plusOneDie) : draw();
  return { ...s, player, rerollsLeft: s.rerollsLeft - 1 };
}

export function finishRound(s: RoundState): RoundResult {
  const player = scored(s.player, s.plusOneDie);
  let haslin = s.haslin;
  let outcome = compareHands(player, haslin);
  if (s.rigged && outcome !== 'win') {
    haslin = [...RIGGED_HASLIN_DICE];
    outcome = compareHands(player, haslin);
    if (outcome !== 'win') {
      // Only the lowest bust can still tie the lowest bust: turn it into a pair so a rigged game always wins.
      const min = Math.min(...player);
      player[lowestIndex(player)] = Math.min(...player.filter((d) => d > min));
      outcome = compareHands(player, haslin);
    }
  }
  const erl = outcome === 'tie' && s.tiesToPlayer;
  return { outcome: erl ? 'win' : outcome, erl, player, haslin, playerHand: evaluateHand(player), haslinHand: evaluateHand(haslin) };
}
