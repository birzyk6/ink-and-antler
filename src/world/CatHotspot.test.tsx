import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { copy } from '../content/copy';
import { INITIAL, useGame } from '../game/store';
import type { SceneHandle } from '../scene/createScene';
import { CatHotspot } from './CatHotspot';

const scene = { pinAnchor: () => () => {}, hoverGlow: () => () => {} } as unknown as SceneHandle;

beforeEach(() => {
  localStorage.clear();
  useGame.setState({ ...INITIAL });
});

describe('CatHotspot', () => {
  it('meows when petted, and keeps the fast travel closed while scrolls remain', async () => {
    const user = userEvent.setup();
    render(<CatHotspot scene={scene} />);
    await user.click(screen.getByRole('button', { name: copy.cat.label }));
    expect(screen.getByText(copy.cat.meow)).toBeInTheDocument();
    expect(useGame.getState().contactOpen).toBe(false);
  });

  it('after both scrolls it shows a marker and opens fast travel', async () => {
    const user = userEvent.setup();
    useGame.setState({ inventory: ['cv', 'letter'] });
    const { container } = render(<CatHotspot scene={scene} />);
    expect(container.querySelector('.marker')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: copy.cat.label }));
    expect(useGame.getState()).toMatchObject({ contactOpen: true, contactSeen: true });
  });
});
