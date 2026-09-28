import { describe, expect, it } from 'vitest';
import { face, seq } from '../test/rng';
import { NO_MODS, PIM_OSSIAN_DICE, finishRound, rerollPlayer, startRound, toggleHold, type RoundState } from './round';

const base: RoundState = {
  ossian: [6, 6, 5], player: [1, 2, 3], held: [false, false, false], rerollsLeft: 1,
  seeOssian: false, tiesToPlayer: false, plusOneDie: false, forcedWin: false,
};

describe('startRound', () => {
  it('Ossian rolls and rerolls non-scoring dice, then the player rolls', () => {
    const rng = seq(face(1), face(2), face(4), face(1), face(2), face(4), face(6), face(6), face(6));
    const s = startRound(NO_MODS, 0, rng);
    expect(s.ossian).toEqual([1, 2, 4]);
    expect(s.player).toEqual([6, 6, 6]);
    expect(s.rerollsLeft).toBe(1);
    expect(s.forcedWin).toBe(false);
  });

  it('setOneSix turns the lowest player die into a 6', () => {
    const rng = seq(face(6), face(6), face(6), face(2), face(5), face(3));
    expect(startRound({ ...NO_MODS, setOneSix: true }, 0, rng).player).toEqual([6, 5, 3]);
  });

  it('adds extra rerolls and pity', () => {
    const rng = seq(face(6));
    expect(startRound({ ...NO_MODS, extraRerolls: 1 }, 0, rng).rerollsLeft).toBe(2);
    expect(startRound(NO_MODS, 1, rng).rerollsLeft).toBe(2);
    expect(startRound(NO_MODS, 2, rng).forcedWin).toBe(true);
  });
});

describe('player actions', () => {
  it('toggleHold flips one die', () => {
    expect(toggleHold(base, 1).held).toEqual([false, true, false]);
  });

  it('rerollPlayer rerolls unheld dice and spends a reroll', () => {
    const s = rerollPlayer(toggleHold(base, 1), seq(face(6), face(5)));
    expect(s.player).toEqual([6, 2, 5]);
    expect(s.rerollsLeft).toBe(0);
    expect(rerollPlayer(s, seq(face(1)))).toBe(s);
  });
});

describe('finishRound', () => {
  const finishRoundBase: RoundState = {
    ossian: [1, 2, 3], player: [6, 6, 5], held: [false, false, false], rerollsLeft: 1,
    seeOssian: false, tiesToPlayer: false, plusOneDie: false, forcedWin: false,
  };

  it('compares hands', () => {
    expect(finishRound({ ...finishRoundBase, player: [6, 6, 6] }).outcome).toBe('win');
    expect(finishRound(finishRoundBase).outcome).toBe('lose');
  });

  it('plusOneDie bumps the lowest die before scoring', () => {
    expect(finishRound({ ...base, player: [1, 5, 5], plusOneDie: true }).player).toEqual([2, 5, 5]);
  });

  it('Pim forces a win after two losses', () => {
    const r = finishRound({ ...finishRoundBase, forcedWin: true });
    expect(r).toMatchObject({ outcome: 'win', pim: true, ossian: PIM_OSSIAN_DICE });
  });
});
