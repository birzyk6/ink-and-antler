import { GlowFilter } from 'pixi-filters';
import { Application, Assets, Container, Rectangle, Sprite, Texture } from 'pixi.js';
import bgUrl from '../assets/bg.webp';
import catUrl from '../assets/cat.webp';
import druidUrl from '../assets/druid.webp';
import fgUrl from '../assets/fg.webp';
import type { DruidScene } from '../game/store';
import { DRUID_H, DRUID_SCALE, DRUID_W, FRAMES, FRAME_H, FRAME_W } from '../npc/druidSheet';
import { createEnteringNpc, createStandingNpc, frameFor, setHold, stepNpc, type NpcState } from '../npc/patrol';
import { prefersReducedMotion } from '../engine/motion';
import { CAT_CUT, STREET_Y } from '../world/layout';
import { anchorTransform, computeStageTransform, type StageTransform } from '../world/stageTransform';

export interface SceneHandle {
  app: Application;
  /** 1920×1080 world container, scaled to the viewport. */
  world: Container;
  /** back: behind the druid (bg, ambient). actors: druid, then the bg bits he walks behind. front: in front (particles). */
  layers: { back: Container; actors: Container; front: Container };
  onTick(fn: (dtMs: number) => void): () => void;
  /** Keeps a world-sized DOM box pinned with its top-left at world (x, y). */
  pinAnchor(el: HTMLElement, x: number, y: number): () => void;
  druidPosition(): { x: number; y: number } | null;
  /** Brightens a character's glow while `el` (its hit area) is hovered or focused. */
  hoverGlow(el: HTMLElement, who: Clickable): () => void;
  setDruid(scene: DruidScene, hold: boolean): void;
  destroy(): void;
}

/** Characters that can be clicked; each wears a faint glow so players notice. */
export type Clickable = 'druid' | 'cat';

const GLOW_IDLE = 1.4;
const GLOW_PULSE = 0.6;
const GLOW_HOVER = 2.6;

export async function createScene(
  host: HTMLElement,
  anchors: { druid: HTMLElement },
  cb: { onDruidArrive: () => void },
): Promise<SceneHandle> {
  const app = new Application();
  await app.init({ resizeTo: window, backgroundAlpha: 0, antialias: false, autoDensity: true, resolution: window.devicePixelRatio || 1 });
  host.appendChild(app.canvas);

  const [bgTex, fgTex, catTex, sheet] = await Promise.all([
    Assets.load<Texture>(bgUrl),
    Assets.load<Texture>(fgUrl),
    Assets.load<Texture>(catUrl),
    Assets.load<Texture>(druidUrl),
  ]);

  const world = new Container();
  const layers = { back: new Container(), actors: new Container(), front: new Container() };
  world.addChild(layers.back, layers.actors, layers.front);
  app.stage.addChild(world);
  layers.back.addChild(new Sprite(bgTex));
  // Same pixels as the painted cat, laid over it only so it can carry a glow.
  const cat = new Sprite(catTex);
  cat.position.set(CAT_CUT.x, CAT_CUT.y);
  layers.back.addChild(cat);

  const frames = Array.from(
    { length: FRAMES },
    (_, i) => new Texture({ source: sheet.source, frame: new Rectangle(i * FRAME_W, 0, FRAME_W, FRAME_H) }),
  );
  const druid = new Sprite(frames[0]);
  druid.anchor.set(0.5, 1);
  druid.visible = false;
  // Shares the actors layer so the intro dusk tints it with the druid.
  layers.actors.addChild(druid, new Sprite(fgTex));

  const glow = (): GlowFilter =>
    new GlowFilter({ distance: 10, outerStrength: GLOW_IDLE, innerStrength: 0, color: 0xffdc8c, quality: 0.2, alpha: 0.85 });
  const glows: Record<Clickable, GlowFilter> = { druid: glow(), cat: glow() };
  druid.filters = [glows.druid];
  cat.filters = [glows.cat];
  const hovered: Record<Clickable, boolean> = { druid: false, cat: false };
  const calm = prefersReducedMotion();
  let glowClock = 0;

  let t: StageTransform = computeStageTransform(window.innerWidth, window.innerHeight);
  const pins = new Map<HTMLElement, { x: number; y: number }>();
  const applyTransform = () => {
    t = computeStageTransform(window.innerWidth, window.innerHeight);
    world.position.set(t.offsetX, t.offsetY);
    world.scale.set(t.scale);
    pins.forEach((p, el) => (el.style.transform = anchorTransform(t, p.x, p.y)));
  };
  applyTransform();
  window.addEventListener('resize', applyTransform);

  let npc: NpcState | null = null;
  let druidScene: DruidScene = 'offstage';
  let hold = false;

  const tickers = new Set<(dtMs: number) => void>();
  const tick = () => {
    const dt = Math.min(app.ticker.deltaMS, 100);
    if (npc) {
      const next = stepNpc(setHold(npc, hold), dt, Math.random, { patrol: druidScene === 'patrolling' });
      if (npc.mode === 'enter' && next.mode !== 'enter') cb.onDruidArrive();
      npc = next;
      druid.texture = frames[frameFor(npc)];
      druid.position.set(npc.x, STREET_Y);
      druid.scale.set(DRUID_SCALE * npc.dir, DRUID_SCALE);
      anchors.druid.style.transform = anchorTransform(t, npc.x - DRUID_W / 2, STREET_Y - DRUID_H);
    }
    glowClock += dt;
    const breathe = calm ? GLOW_IDLE : GLOW_IDLE + GLOW_PULSE * Math.sin(glowClock / 650);
    for (const who of ['druid', 'cat'] as const) {
      const g = glows[who];
      g.outerStrength += ((hovered[who] ? GLOW_HOVER : breathe) - g.outerStrength) * Math.min(1, dt / 90);
    }
    tickers.forEach((fn) => fn(dt));
  };

  const hoverGlow = (el: HTMLElement, who: Clickable) => {
    const on = () => (hovered[who] = true);
    const off = () => (hovered[who] = false);
    const events = [['pointerenter', on], ['pointerleave', off], ['focusin', on], ['focusout', off]] as const;
    events.forEach(([e, fn]) => el.addEventListener(e, fn));
    return () => {
      off();
      events.forEach(([e, fn]) => el.removeEventListener(e, fn));
    };
  };
  const unhoverDruid = hoverGlow(anchors.druid, 'druid');
  app.ticker.add(tick);

  return {
    app,
    world,
    layers,
    onTick(fn) {
      tickers.add(fn);
      return () => tickers.delete(fn);
    },
    pinAnchor(el, x, y) {
      pins.set(el, { x, y });
      el.style.transform = anchorTransform(t, x, y);
      return () => pins.delete(el);
    },
    druidPosition: () => (npc ? { x: npc.x, y: STREET_Y } : null),
    hoverGlow,
    setDruid(scene, nextHold) {
      druidScene = scene;
      hold = nextHold;
      if (scene === 'offstage') {
        npc = null;
        druid.visible = false;
        return;
      }
      if (!npc) npc = scene === 'entering' ? createEnteringNpc() : createStandingNpc();
      druid.visible = true;
    },
    destroy() {
      window.removeEventListener('resize', applyTransform);
      app.ticker.remove(tick);
      unhoverDruid();
      // Textures stay in the Assets cache so a StrictMode remount can reuse them.
      app.destroy(true, { children: true });
    },
  };
}
