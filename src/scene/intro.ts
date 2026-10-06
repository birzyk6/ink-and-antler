import gsap from 'gsap';
import { ColorMatrixFilter } from 'pixi.js';
import { prefersReducedMotion } from '../engine/motion';
import { DUSK, IDENTITY, lerpMatrix } from './colorMatrix';
import type { SceneHandle } from './createScene';

/** The town wakes from dusk into day, then the druid can walk on. */
export function playIntro(h: SceneHandle, opts: { skip: boolean }): { done: Promise<void>; kill(): void } {
  const dusk = new ColorMatrixFilter();
  h.layers.back.filters = [dusk];
  h.layers.actors.filters = [dusk];
  const state = { dusk: 1 };
  const apply = () => {
    dusk.matrix = lerpMatrix(IDENTITY, DUSK, state.dusk) as ColorMatrixFilter['matrix'];
  };
  apply();

  const tl = gsap.timeline({ onUpdate: apply }).to(state, { dusk: 0, duration: 1.2, ease: 'steps(8)' }, 0.4);

  const done = new Promise<void>((resolve) => {
    tl.eventCallback('onComplete', () => {
      apply();
      h.layers.back.filters = [];
      h.layers.actors.filters = [];
      resolve();
    });
  });
  if (opts.skip || prefersReducedMotion()) tl.progress(1);

  return { done, kill: () => tl.kill() };
}
