import { beforeEach, describe, expect, it } from 'vitest';
import { copy } from '../content/copy';
import { d20, faces, seq } from '../test/rng';
import { INITIAL, PITY_LOSSES, selectDruidHold, useGame } from './store';

const g = () => useGame.getState();

/** Haslin rolls a bust and rerolls it into the same bust (1,2,3,4,6); the player rolls `player`. */
const game = (...player: number[]) => faces(1, 2, 3, 4, 6, 1, 2, 3, 4, 6, ...player);

beforeEach(() => {
  localStorage.clear();
  useGame.setState({ ...INITIAL, druid: 'waiting' });
});

describe('druid scene', () => {
  it('enters, greets, then waits', () => {
    useGame.setState({ druid: 'offstage' });
    g().startDruidEntrance();
    expect(g().druid).toBe('entering');
    g().druidArrived();
    expect(g().druid).toBe('greeting');
    g().greetingDone();
    expect(g()).toMatchObject({ druid: 'waiting', introSeen: true });
  });

  it('holds the druid still while greeting, waiting or talking', () => {
    expect(selectDruidHold({ ...g(), druid: 'waiting' })).toBe(true);
    expect(selectDruidHold({ ...g(), druid: 'patrolling', node: null })).toBe(false);
    expect(selectDruidHold({ ...g(), druid: 'patrolling', node: { id: 'origin' } })).toBe(true);
  });

  it('does not hold the druid during his entrance unless he is talking', () => {
    expect(selectDruidHold({ ...g(), druid: 'entering', node: null })).toBe(false);
    expect(selectDruidHold({ ...g(), druid: 'entering', node: { id: 'origin' } })).toBe(true);
  });
});

describe('dialogue flow', () => {
  it('ignores clicks while the druid is offstage', () => {
    useGame.setState({ druid: 'offstage' });
    g().talk();
    expect(g().node).toBeNull();
  });

  it('clicking him mid-entrance skips the greeting and opens the dialogue', () => {
    useGame.setState({ druid: 'entering' });
    g().talk();
    expect(g()).toMatchObject({ druid: 'waiting', introSeen: true, node: { id: 'origin' } });
    g().druidArrived();
    expect(g().druid).toBe('waiting');
  });

  it('asks for an origin first, then the wager', () => {
    g().talk();
    expect(g().node).toEqual({ id: 'origin' });
    g().chooseOrigin('CHA');
    expect(g()).toMatchObject({ origin: 'CHA', node: { id: 'wager', afterOrigin: 'CHA' } });
  });

  it('wins a game after a successful trick, then offers the last scroll', () => {
    g().talk();
    g().chooseOrigin('CHA');
    g().chooseWager('cv');
    expect(g().node).toEqual({ id: 'check', wager: 'cv', oneLeft: false });
    useGame.setState({ rng: seq(...d20(15), ...game(6, 6, 6, 6, 6)) });
    g().chooseCheck('persuasion');
    expect(g().node).toMatchObject({ id: 'rolling', roll: 15, modifier: 3, dc: 12, success: true });
    g().continueAfterRoll();
    expect(g().node).toEqual({ id: 'dice', wager: 'cv' });
    expect(g().round?.rerollsLeft).toBe(2);
    g().revealRound();
    expect(g().node).toMatchObject({ id: 'roundWon', wager: 'cv' });
    expect(g().inventory).toEqual(['cv']);
    expect(g().justReceived).toEqual(['cv']);
    g().continueDialogue();
    expect(g().node).toEqual({ id: 'check', wager: 'letter', oneLeft: true });
  });

  it('talking with one scroll left goes straight to the tricks', () => {
    useGame.setState({ origin: 'DEX', inventory: ['cv'] });
    g().talk();
    expect(g().node).toEqual({ id: 'check', wager: 'letter', oneLeft: true });
  });

  it('rerolls are per game: a rematch starts with one', () => {
    useGame.setState({ node: { id: 'check', wager: 'cv', oneLeft: false }, lossStreak: 1, rng: seq(...game(6, 6, 6, 6, 6)) });
    g().justRoll();
    expect(g().round?.rerollsLeft).toBe(1);
  });

  it('a natural 20 rigs the game, then Haslin goes double or nothing and loses again', () => {
    useGame.setState({ origin: 'WIS', node: { id: 'check', wager: 'letter', oneLeft: false }, rng: seq(...d20(20), ...game(1, 2, 3, 4, 6)) });
    g().chooseCheck('animal');
    expect(g().node).toMatchObject({ id: 'rolling', roll: 20, success: true });
    expect(g().inventory).toEqual([]);
    g().continueAfterRoll();
    expect(g().celebrate).toBe(1);
    expect(g().round?.rigged).toBe(true);
    g().revealRound();
    expect(g().node).toMatchObject({ id: 'roundWon', wager: 'letter', result: { outcome: 'win' } });
    g().continueDialogue();
    expect(g().node).toEqual({ id: 'double', wager: 'cv' });
    g().acceptDouble();
    expect(g().node).toEqual({ id: 'dice', wager: 'cv' });
    expect(g().round?.rigged).toBe(true);
    g().revealRound();
    expect(g().inventory).toEqual(['letter', 'cv']);
    g().continueDialogue();
    expect(g().node).toEqual({ id: 'epilogue' });
    g().continueDialogue();
    expect(g()).toMatchObject({ node: null, druid: 'patrolling' });
  });

  it('a natural 20 on the last scroll just wins it', () => {
    useGame.setState({ origin: 'CHA', inventory: ['cv'], node: { id: 'check', wager: 'letter', oneLeft: true }, rng: seq(...d20(20), ...game(1, 2, 3, 4, 6)) });
    g().chooseCheck('persuasion');
    g().continueAfterRoll();
    g().revealRound();
    g().continueDialogue();
    expect(g().node).toEqual({ id: 'epilogue' });
  });

  it('a tie replays the same game and is not a loss', () => {
    useGame.setState({ node: { id: 'check', wager: 'cv', oneLeft: false }, rng: seq(...game(6, 4, 3, 2, 1)) });
    g().justRoll();
    g().revealRound();
    expect(g()).toMatchObject({ lossStreak: 0, inventory: [], node: { id: 'roundTied', wager: 'cv' } });
    g().continueDialogue();
    expect(g().node).toEqual({ id: 'dice', wager: 'cv' });
    expect(g().round).not.toBeNull();
  });

  it('Erl turns a tie into a win after Animal Handling', () => {
    useGame.setState({ origin: 'WIS', node: { id: 'check', wager: 'cv', oneLeft: false }, rng: seq(...d20(10), ...game(6, 4, 3, 2, 1)) });
    g().chooseCheck('animal');
    g().continueAfterRoll();
    g().revealRound();
    expect(g().node).toMatchObject({ id: 'roundWon', result: { outcome: 'win', erl: true } });
  });

  it('a loss offers a rematch with fresh tricks', () => {
    useGame.setState({ node: { id: 'check', wager: 'letter', oneLeft: false }, rng: seq(...faces(6, 6, 6, 6, 6, 1, 2, 3, 4, 6)) });
    g().justRoll();
    g().revealRound();
    expect(g()).toMatchObject({ lossStreak: 1, node: { id: 'roundLost', wager: 'letter' } });
    g().continueDialogue();
    expect(g().node).toEqual({ id: 'check', wager: 'letter', oneLeft: false });
  });

  it(`after ${PITY_LOSSES} losses in a row the next game is rigged`, () => {
    useGame.setState({ lossStreak: PITY_LOSSES, node: { id: 'check', wager: 'cv', oneLeft: false }, rng: seq(...faces(6, 6, 6, 6, 6, 1, 2, 3, 4, 6)) });
    g().justRoll();
    expect(g().round?.rigged).toBe(true);
    g().revealRound();
    expect(g()).toMatchObject({ lossStreak: 0, node: { id: 'roundWon' } });
  });

  it('rewind steps back through choices until a die is rolled', () => {
    g().talk();
    g().chooseOrigin('CHA');
    g().chooseWager('cv');
    g().rewind();
    expect(g().node).toEqual({ id: 'wager', afterOrigin: 'CHA' });
    g().rewind();
    expect(g()).toMatchObject({ node: { id: 'origin' }, origin: null, history: [] });
    g().rewind();
    expect(g().node).toEqual({ id: 'origin' });
    g().chooseOrigin('INT');
    g().chooseWager('cv');
    useGame.setState({ rng: seq(...d20(5)) });
    g().chooseCheck('investigation');
    expect(g().history).toEqual([]);
  });

  it('once everything is won, each bark is spoken once', () => {
    useGame.setState({ inventory: ['cv', 'letter'], druid: 'patrolling' });
    for (const bark of copy.barks) {
      g().talk();
      expect(g().bark).toBe(bark);
      g().clearBark();
    }
    g().talk();
    expect(g()).toMatchObject({ bark: null, node: null, barkIndex: copy.barks.length });
  });
});

describe('satchel and persistence', () => {
  it('flags the first viewing of an item', () => {
    useGame.setState({ inventory: ['letter'] });
    g().viewItem('letter');
    expect(g()).toMatchObject({ viewing: 'letter', viewingFirstTime: true, opened: ['letter'] });
    g().viewItem(null);
    g().viewItem('letter');
    expect(g().viewingFirstTime).toBe(false);
  });

  it('skipTale grants both documents and opens the CV', () => {
    g().skipTale();
    expect(g()).toMatchObject({ inventory: ['cv', 'letter'], viewing: 'cv', introSeen: true });
  });

  it('persists only the durable fields', () => {
    g().talk();
    g().chooseOrigin('DEX');
    g().skipTale();
    const saved = JSON.parse(localStorage.getItem('ink-antler-v1')!).state;
    expect(saved).toEqual({ origin: 'DEX', inventory: ['cv', 'letter'], opened: ['cv'], introSeen: true, contactSeen: false, barkIndex: 0 });
  });
});
