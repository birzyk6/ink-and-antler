import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { copy } from '../content/copy';
import { INITIAL, useGame } from '../game/store';
import { d20, faces, seq } from '../test/rng';
import { DialoguePanel } from './DialoguePanel';

/** Haslin's bust (rerolled into itself), then five 6s for the player. */
const WINNING_GAME = faces(1, 2, 3, 4, 6, 1, 2, 3, 4, 6, 6, 6, 6, 6, 6);

beforeEach(() => {
  localStorage.clear();
  useGame.setState({ ...INITIAL, druid: 'waiting' });
});

describe('DialoguePanel', () => {
  it('renders nothing without a node', () => {
    const { container } = render(<DialoguePanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it('origin → wager → natural 20 → rigged win → double or nothing', async () => {
    const user = userEvent.setup();
    useGame.setState({ rng: seq(...d20(20), ...WINNING_GAME) });
    useGame.getState().talk();
    render(<DialoguePanel />);

    expect(screen.getByText(copy.originPrompt)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /minstrel/i }));
    expect(screen.getByText(/Ahhh, a poet/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /The scroll\./ }));
    await user.click(screen.getByRole('button', { name: /Surely a guest rolls first/ }));
    expect(screen.getByText('NATURAL 20')).toBeInTheDocument();
    expect(useGame.getState().inventory).toEqual([]);

    await user.click(screen.getByRole('button', { name: /Let the dice fall/ }));
    await user.click(screen.getByRole('button', { name: copy.dice.reveal }));
    expect(screen.getByText(copy.prize.cv, { exact: false })).toBeInTheDocument();
    expect(useGame.getState().inventory).toEqual(['cv']);

    await user.click(screen.getByRole('button', { name: /Take it/ }));
    expect(screen.getByText(copy.doubleOrNothing)).toBeInTheDocument();
  });

  it('separates lines with a blank line', async () => {
    const user = userEvent.setup();
    useGame.getState().talk();
    render(<DialoguePanel />);
    await user.click(screen.getByRole('button', { name: /minstrel/i }));
    expect(document.querySelector('.dialogue-text')?.textContent).toBe(`${copy.origins.CHA.reply}\n\n${copy.wagerPrompt}`);
  });

  it('rewind steps back to the previous choice', async () => {
    const user = userEvent.setup();
    useGame.getState().talk();
    render(<DialoguePanel />);
    expect(screen.queryByRole('button', { name: /Rewind/ })).not.toBeInTheDocument();
    await user.keyboard('1');
    await user.click(screen.getByRole('button', { name: /Rewind/ }));
    expect(screen.getByText(copy.originPrompt)).toBeInTheDocument();
    expect(useGame.getState().origin).toBeNull();
  });

  it('the dice tray has five dice and Reroll / Reveal buttons', async () => {
    const user = userEvent.setup();
    useGame.setState({ node: { id: 'check', wager: 'cv', oneLeft: false }, rng: seq(...WINNING_GAME) });
    render(<DialoguePanel />);
    await user.click(screen.getByRole('button', { name: /Just roll the dice/ }));
    expect(screen.getAllByRole('button', { name: /Your die/ })).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Reroll' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Reveal' })).toBeInTheDocument();
    expect(screen.queryByText(/bones/i)).not.toBeInTheDocument();
  });

  it('number keys pick choices', async () => {
    const user = userEvent.setup();
    useGame.getState().talk();
    render(<DialoguePanel />);
    await user.keyboard('2');
    expect(useGame.getState().origin).toBe('INT');
  });

  it('ignores number keys while the satchel is open', async () => {
    const user = userEvent.setup();
    useGame.getState().talk();
    useGame.setState({ satchelOpen: true });
    render(<DialoguePanel />);
    await user.keyboard('1');
    expect(useGame.getState().origin).toBeNull();
  });
});
