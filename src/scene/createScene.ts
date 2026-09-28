import { Application, Assets, Container, Rectangle, Sprite, Texture } from 'pixi.js';
import bgUrl from '../assets/bg.webp';
import druidUrl from '../assets/druid.webp';
import type { DruidScene } from '../game/store';
import { DRUID_H, DRUID_SCALE, DRUID_W, FRAMES, FRAME_H, FRAME_W } from '../npc/druidSheet';
import { createEnteringNpc, createStandingNpc, frameFor, setHold, stepNpc, type NpcState } from '../npc/patrol';
import { STREET_Y } from '../world/layout';
import { anchorTransform, computeStageTransform, type StageTransform } from '../world/stageTransform';

export interface SceneHandle {
  app: Application;
  /** 1920×1080 world container, scaled to the viewport. */
  world: Container;
  /** back: behind the druid (bg, ambient). actors: druid. front: in front (sign, particles, dusk). */
  layers: { back: Container; actors: Container; front: Container };
  onTick(fn: (dtMs: number) => void): () => void;
  /** Keeps a world-sized DOM box pinned with its top-left at world (x, y). */
  pinAnchor(el: HTMLElement, x: number, y: number): () => void;
  druidPosition(): { x: number; y: number } | null;
  setDruid(scene: DruidScene, hold: boolean): void;
  destroy(): void;
}

export async function createScene(
  host: HTMLElement,
  anchors: { druid: HTMLElement },
  cb: { onDruidArrive: () => void },
): Promise<SceneHandle> {
  const app = new Application();
  await app.init({ resizeTo: window, backgroundAlpha: 0, antialias: false, autoDensity: true, resolution: window.devicePixelRatio || 1 });
  host.appendChild(app.canvas);

  const [bgTex, sheet] = await Promise.all([Assets.load<Texture>(bgUrl), Assets.load<Texture>(druidUrl)]);

  const world = new Container();
  const layers = { back: new Container(), actors: new Container(), front: new Container() };
  world.addChild(layers.back, layers.actors, layers.front);
  app.stage.addChild(world);
  layers.back.addChild(new Sprite(bgTex));

  const frames = Array.from(
    { length: FRAMES },
    (_, i) => new Texture({ source: sheet.source, frame: new Rectangle(i * FRAME_W, 0, FRAME_W, FRAME_H) }),
  );
  const druid = new Sprite(frames[0]);
  druid.anchor.set(0.5, 1);
  druid.visible = false;
  layers.actors.addChild(druid);

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
    tickers.forEach((fn) => fn(dt));
  };
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
      // Textures stay in the Assets cache so a StrictMode remount can reuse them.
      app.destroy(true, { children: true });
    },
  };
}
