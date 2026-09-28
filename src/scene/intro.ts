import gsap from 'gsap';
import { ColorMatrixFilter } from 'pixi.js';
import { prefersReducedMotion } from '../engine/motion';
import { DUSK, IDENTITY, lerpMatrix } from './colorMatrix';
import type { SceneHandle } from './createScene';
import type { TitleSign } from './titleSign';

export interface IntroOptions {
  skip: boolean;
  onIgnite?: (x: number, y: number) => void;
}

export function playIntro(h: SceneHandle, sign: TitleSign, opts: IntroOptions): { done: Promise<void>; kill(): void } {
  const dusk = new ColorMatrixFilter();
  h.layers.back.filters = [dusk];
  h.layers.actors.filters = [dusk];
  const state = { dusk: 1, board: 0.45, glow: 0 };
  const apply = () => {
    dusk.matrix = lerpMatrix(IDENTITY, DUSK, state.dusk) as ColorMatrixFilter['matrix'];
    sign.boardFilter.brightness(state.board, false);
    sign.glowFilter.outerStrength = state.glow;
  };
  apply();

  const ignite = (i: number) => () => {
    const t = sign.torches[i];
    t.flame.visible = true;
    t.flame.play();
    opts.onIgnite?.(t.x, t.y);
  };

  const tl = gsap.timeline({ onUpdate: apply });
  sign.torches.forEach((t, i) => {
    const at = 0.4 + i * 0.4;
    tl.call(ignite(i), undefined, at)
      .fromTo(t.flame.scale, { x: 0, y: 0 }, { x: 4, y: 4, duration: 0.35, ease: 'back.out(3)' }, at)
      .to(t.glow, { alpha: 1, duration: 0.4 }, at);
  });
  tl.to(state, { board: 1, duration: 0.4, ease: 'steps(4)' }, 1.2)
    .to(state, { glow: 4, duration: 0.3, ease: 'power2.out' }, 1.2)
    .to(state, { glow: 1.2, duration: 0.8, ease: 'power2.in' }, 1.5)
    .to(sign.swing, { rotation: 0.07, duration: 0.3, ease: 'sine.out' }, 1.2)
    .to(sign.swing, { rotation: 0, duration: 1.8, ease: 'elastic.out(1, 0.25)' }, 1.5)
    .to(state, { dusk: 0, duration: 1.2, ease: 'steps(8)' }, 1.7);

  // Torches flicker and the sign sways a little, forever.
  const idle = gsap.timeline({ paused: true, repeat: -1 });
  idle.to(sign.swing, { rotation: 0.018, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: 1, delay: 6 });
  sign.torches.forEach((t) => idle.to(t.glow, { alpha: 0.75, duration: 0.15, ease: 'steps(2)', yoyo: true, repeat: 5 }, 0));

  const done = new Promise<void>((resolve) => {
    tl.eventCallback('onComplete', () => {
      apply();
      h.layers.back.filters = [];
      h.layers.actors.filters = [];
      if (!prefersReducedMotion()) idle.play();
      resolve();
    });
  });
  if (opts.skip || prefersReducedMotion()) tl.progress(1);

  return {
    done,
    kill() {
      tl.kill();
      idle.kill();
    },
  };
}
