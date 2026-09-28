import { beforeEach, describe, expect, it } from 'vitest';
import { copy } from '../content/copy';
import { d20, face, seq } from '../test/rng';
import { INITIAL, selectDruidHold, useGame } from './store';

const g = () => useGame.getState();

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

  it('holds the druid still while entering, greeting, waiting or talking', () => {
    expect(selectDruidHold({ ...g(), druid: 'waiting' })).toBe(true);
    expect(selectDruidHold({ ...g(), druid: 'patrolling', node: null })).toBe(false);
    expect(selectDruidHold({ ...g(), druid: 'patrolling', node: { id: 'origin' } })).toBe(true);
  });
});

describe('dialogue flow', () => {
  it('ignores clicks while the druid is not on stage', () => {
    useGame.setState({ druid: 'entering' });
    g().talk();
    expect(g().node).toBeNull();
  });

  it('asks for an origin first, then the wager', () => {
    g().talk();
    expect(g().node).toEqual({ id: 'origin' });
    g().chooseOrigin('CHA');
    expect(g()).toMatchObject({ origin: 'CHA', node: { id: 'wager', afterOrigin: 'CHA' } });
  });

  it('wins a round after a successful check', () => {
    g().talk();
    g().chooseOrigin('CHA');
    g().chooseWager('cv');
    useGame.setState({
      rng: seq(...d20(15), face(1), face(2), face(4), face(1), face(2), face(4), face(6), face(6), face(6)),
    });
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
    expect(g().node).toEqual({ id: 'wager', afterOrigin: null });
  });

  it('a natural 20 grants everything, bumps celebrate, then ends the tale', () => {
    useGame.setState({ origin: 'WIS', node: { id: 'check', wager: 'letter' }, rng: seq(...d20(20)) });
    g().chooseCheck('insight');
    g().continueAfterRoll();
    expect(g().inventory).toEqual(['cv', 'letter']);
    expect(g().node).toEqual({ id: 'nat20', items: ['cv', 'letter'] });
    expect(g().celebrate).toBe(1);
    g().continueDialogue();
    expect(g().node).toEqual({ id: 'epilogue' });
    g().continueDialogue();
    expect(g()).toMatchObject({ node: null, druid: 'patrolling' });
  });

  it('a loss offers a rematch with a fresh check', () => {
    useGame.setState({
      origin: 'INT',
      node: { id: 'check', wager: 'letter' },
      rng: seq(face(6), face(6), face(6), face(1), face(2), face(4)),
    });
    g().justRoll();
    g().revealRound();
    expect(g()).toMatchObject({ lossStreak: 1, node: { id: 'roundLost', wager: 'letter' } });
    g().continueDialogue();
    expect(g().node).toEqual({ id: 'check', wager: 'letter' });
  });

  it('once everything is won, clicking the druid cycles barks', () => {
    useGame.setState({ inventory: ['cv', 'letter'], druid: 'patrolling' });
    g().talk();
    expect(g().bark).toBe(copy.barks[0]);
    g().clearBark();
    g().talk();
    expect(g().bark).toBe(copy.barks[1]);
    expect(g().node).toBeNull();
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
    expect(saved).toEqual({ origin: 'DEX', inventory: ['cv', 'letter'], opened: ['cv'], introSeen: true, contactSeen: false });
  });
});
