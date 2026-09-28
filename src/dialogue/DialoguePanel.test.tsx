import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { copy } from '../content/copy';
import { INITIAL, useGame } from '../game/store';
import { d20, face, seq } from '../test/rng';
import { DialoguePanel } from './DialoguePanel';

beforeEach(() => {
  localStorage.clear();
  useGame.setState({ ...INITIAL, druid: 'waiting' });
});

describe('DialoguePanel', () => {
  it('renders nothing without a node', () => {
    const { container } = render(<DialoguePanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it('origin → wager → check → natural 20 → both documents', async () => {
    const user = userEvent.setup();
    useGame.setState({ rng: seq(...d20(20)) });
    useGame.getState().talk();
    render(<DialoguePanel />);

    expect(screen.getByText(copy.originPrompt)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /recruiter/i }));
    expect(screen.getByText(/Ghent! Pim/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /The scroll\./ }));
    await user.click(screen.getByRole('button', { name: /Surely a guest rolls first/ }));
    expect(screen.getByText('NATURAL 20')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Let the bones fall/ }));
    expect(screen.getByText(/Take both/)).toBeInTheDocument();
    expect(useGame.getState().inventory).toEqual(['cv', 'letter']);
  });

  it('plays a dice round after a normal check', async () => {
    const user = userEvent.setup();
    useGame.setState({
      origin: 'CHA',
      rng: seq(...d20(15), face(1), face(2), face(4), face(1), face(2), face(4), face(6), face(6), face(6)),
    });
    useGame.getState().talk();
    render(<DialoguePanel />);

    await user.click(screen.getByRole('button', { name: /The letter\./ }));
    await user.click(screen.getByRole('button', { name: /Surely a guest rolls first/ }));
    expect(screen.getByText('SUCCESS')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Let the bones fall/ }));

    await user.click(screen.getByRole('button', { name: copy.dice.reveal }));
    expect(screen.getByText(/said your name/)).toBeInTheDocument();
    expect(useGame.getState().inventory).toEqual(['letter']);
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
