import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CONTACT, copy } from '../content/copy';
import { INITIAL, useGame } from '../game/store';
import { ContactModal } from './ContactModal';

beforeEach(() => useGame.setState({ ...INITIAL, contactOpen: true }));

describe('ContactModal (fast travel)', () => {
  it('offers the Postal Office and the Guild Hall', () => {
    render(<ContactModal />);
    expect(screen.getByRole('dialog', { name: copy.fastTravel.title })).toBeInTheDocument();
    expect(screen.getByText(copy.fastTravel.postal)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: CONTACT.email })).toHaveAttribute('href', `mailto:${CONTACT.email}`);
    expect(screen.getByText(copy.fastTravel.guild)).toBeInTheDocument();
    const linkedin = screen.getByRole('link', { name: 'LinkedIn' });
    expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/in/varmblixt');
    expect(linkedin).toHaveAttribute('target', '_blank');
  });

  it('copies the email address on click and says so', async () => {
    const user = userEvent.setup();
    render(<ContactModal />);
    await user.click(screen.getByRole('link', { name: CONTACT.email }));
    expect(await navigator.clipboard.readText()).toBe(CONTACT.email);
    expect(screen.getByRole('status')).toHaveTextContent(copy.fastTravel.copied);
  });
});
