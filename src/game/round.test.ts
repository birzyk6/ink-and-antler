import { describe, expect, it } from 'vitest';
import { faces, seq } from '../test/rng';
import { NO_MODS, RIGGED_HASLIN_DICE, finishRound, rerollPlayer, startRound, toggleHold, type RoundState } from './round';

// Haslin rolls a pair of 6s, keeps it, rerolls the rest into 4, 5, 1.
const HASLIN_PAIR = faces(6, 6, 1, 2, 3, 4, 5, 1);

const base: RoundState = {
  haslin: [6, 6, 4, 5, 1],
  player: [1, 2, 3, 4, 6],
  held: [true, true, false, false, false],
  rerollsLeft: 1,
  tiesToPlayer: false,
  plusOneDie: false,
  rigged: false,
};

describe('startRound', () => {
  it('Haslin rolls and rerolls non-scoring dice, then the player rolls five', () => {
    const s = startRound(NO_MODS, seq(...HASLIN_PAIR, ...faces(1, 2, 3, 4, 6)));
    expect(s.haslin).toEqual([6, 6, 4, 5, 1]);
    expect(s.player).toEqual([1, 2, 3, 4, 6]);
    expect(s.held).toEqual([false, false, false, false, false]);
    expect(s.rerollsLeft).toBe(1);
  });

  it('rerolls are per game: one, plus one from Persuasion', () => {
    expect(startRound({ ...NO_MODS, extraRerolls: 1 }, seq(...HASLIN_PAIR, ...faces(1, 2, 3, 4, 6))).rerollsLeft).toBe(2);
  });

  it('setOneSix turns the lowest player die into a 6', () => {
    const s = startRound({ ...NO_MODS, setOneSix: true }, seq(...HASLIN_PAIR, ...faces(3, 1, 4, 2, 5)));
    expect(s.player).toEqual([3, 6, 4, 2, 5]);
  });

  it('a failed switcheroo gives Haslin a second reroll', () => {
    const rng = seq(...faces(6, 6, 1, 2, 3), ...faces(4, 5, 1), ...faces(6, 6, 6), ...faces(1, 2, 3, 4, 6));
    expect(startRound({ ...NO_MODS, haslinExtraReroll: true }, rng).haslin).toEqual([6, 6, 6, 6, 6]);
  });

  it('a rigged game redraws the player until the hand wins', () => {
    const rng = seq(...HASLIN_PAIR, ...faces(1, 2, 3, 4, 6), ...faces(5, 5, 5, 1, 2));
    const s = startRound({ ...NO_MODS, rigged: true }, rng);
    expect(s.player).toEqual([5, 5, 5, 1, 2]);
    expect(s.rigged).toBe(true);
  });
});

describe('player actions', () => {
  it('toggleHold flips one die', () => {
    expect(toggleHold(base, 2).held).toEqual([true, true, true, false, false]);
  });

  it('rerollPlayer rerolls unheld dice and spends a reroll', () => {
    const s = rerollPlayer(base, seq(...faces(4, 4, 6)));
    expect(s.player).toEqual([1, 2, 4, 4, 6]);
    expect(s.rerollsLeft).toBe(0);
    expect(rerollPlayer(s, seq(...faces(1)))).toBe(s);
  });

  it('a rigged reroll keeps redrawing until it still wins', () => {
    const s = rerollPlayer({ ...base, rigged: true }, seq(...faces(4, 4, 6), ...faces(6, 6, 6)));
    expect(s.player).toEqual([1, 2, 6, 6, 6]);
  });
});

describe('finishRound', () => {
  it('compares hands', () => {
    expect(finishRound({ ...base, player: [3, 3, 3, 1, 2] }).outcome).toBe('win');
    expect(finishRound(base).outcome).toBe('lose');
  });

  it('a tie is a tie, unless Erl is on your side', () => {
    const tie = { ...base, haslin: [1, 2, 3, 4, 6], player: [6, 4, 3, 2, 1] };
    expect(finishRound(tie)).toMatchObject({ outcome: 'tie', erl: false });
    expect(finishRound({ ...tie, tiesToPlayer: true })).toMatchObject({ outcome: 'win', erl: true });
  });

  it('plusOneDie bumps the lowest die before scoring', () => {
    expect(finishRound({ ...base, player: [1, 5, 5, 2, 3], plusOneDie: true }).player).toEqual([2, 5, 5, 2, 3]);
  });

  it('a rigged round that still is not a win shows Haslin the lowest hand', () => {
    const r = finishRound({ ...base, haslin: [6, 6, 6, 6, 6], player: [6, 6, 6, 6, 6], rigged: true });
    expect(r).toMatchObject({ outcome: 'win', erl: false, haslin: RIGGED_HASLIN_DICE });
  });

  it('a rigged reroll with unheldable player dice adjusts to guarantee a win', () => {
    const r = finishRound({ ...base, haslin: [6, 6, 6, 6, 6], player: [1, 2, 3, 4, 6], rigged: true });
    expect(r).toMatchObject({ outcome: 'win', erl: false, haslin: RIGGED_HASLIN_DICE });
    expect(r.playerHand.rank).toBe('pair');
  });
});
