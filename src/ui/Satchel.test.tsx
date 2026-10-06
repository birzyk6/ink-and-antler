import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { copy, items } from '../content/copy';
import { CV, MOTIVATION_LETTER } from '../content/documents';
import { INITIAL, useGame } from '../game/store';
import { DocumentViewer } from './DocumentViewer';
import { Satchel } from './Satchel';

beforeEach(() => {
  localStorage.clear();
  useGame.setState({ ...INITIAL });
});

describe('Satchel', () => {
  it('shows an unread badge and opens the scroll', async () => {
    const user = userEvent.setup();
    useGame.setState({ inventory: ['cv'] });
    render(
      <>
        <Satchel />
        <DocumentViewer />
      </>,
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: copy.satchel.open }));
    await user.click(screen.getByRole('button', { name: items.cv.name }));
    expect(screen.getByRole('dialog', { name: items.cv.name })).toBeInTheDocument();
    expect(screen.getByText(CV.title)).toBeInTheDocument();
    expect(useGame.getState().opened).toEqual(['cv']);
    await user.click(screen.getByRole('button', { name: copy.viewer.close }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the letter (seal skipped under reduced motion)', async () => {
    const user = userEvent.setup();
    useGame.setState({ inventory: ['letter'], satchelOpen: true });
    render(
      <>
        <Satchel />
        <DocumentViewer />
      </>,
    );
    await user.click(screen.getByRole('button', { name: items.letter.name }));
    expect(screen.getByText(MOTIVATION_LETTER.salutation)).toBeInTheDocument();
  });

  it('shows a BG3-style card: name, "Scroll · rarity", flavour and weight', async () => {
    const user = userEvent.setup();
    useGame.setState({ inventory: ['cv', 'letter'], satchelOpen: true });
    const { container } = render(<Satchel />);
    expect(container.querySelectorAll('.slot--full svg.scroll-icon')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: items.cv.name })).toBeInTheDocument();
    expect(screen.getByText(`${copy.satchel.type} · Legendary`)).toBeInTheDocument();
    await user.hover(screen.getByRole('button', { name: items.letter.name }));
    expect(screen.getByRole('heading', { name: items.letter.name })).toBeInTheDocument();
    expect(screen.getByText(`${copy.satchel.type} · Rare`)).toBeInTheDocument();
    expect(screen.getByText(`"${items.letter.flavour}"`)).toBeInTheDocument();
  });

  it('keeps the card box when the satchel is empty, so the panel never resizes', () => {
    useGame.setState({ satchelOpen: true });
    const { container } = render(<Satchel />);
    expect(container.querySelector('.item-card')).toHaveTextContent(copy.satchel.empty);
  });
});
