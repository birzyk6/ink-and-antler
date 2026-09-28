import { AnimatedSprite, ColorMatrixFilter, Container, Graphics, Sprite, Text } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { SIGN_NAME, SIGN_SUBTITLE } from '../content/copy';
import { P } from '../pixel/palette';
import { FLAME, FLAMES, IRON, IRON_WOOD, TORCH, WOOD, barRows, chainRows, signBoardRows } from '../pixel/sprites';
import { SIGN } from '../world/layout';
import type { SceneHandle } from './createScene';
import { pixelTexture } from './pixelTexture';
import { radialTexture } from './radialTexture';

/** World px per sign pixel. */
const S = 4;
const BAR_W = 150;
const BOARD_W = 120;
const BOARD_H = 36;
const BOARD_X = (BAR_W - BOARD_W) / 2;
const LINKS = 4;
const TORCH_H = TORCH.length;
const FLAME_H = FLAMES[0].length;

export interface Torch {
  root: Container;
  flame: AnimatedSprite;
  glow: Sprite;
  /** Flame centre in world px. */
  x: number;
  y: number;
}

export interface TitleSign {
  root: Container;
  swing: Container;
  board: Container;
  boardFilter: ColorMatrixFilter;
  glowFilter: GlowFilter;
  torches: Torch[];
  destroy(): void;
}

export async function createTitleSign(h: SceneHandle): Promise<TitleSign> {
  await Promise.all([document.fonts.load('56px "Jacquard 24"'), document.fonts.load('22px "Pixelify Sans"')]);
  const r = h.app.renderer;
  const left = SIGN.x - (BAR_W * S) / 2;

  const root = new Container();
  root.position.set(left, 0);

  const rods = new Graphics();
  for (const x of [20, 126]) rods.rect(x * S, 0, 2 * S, SIGN.top).fill(P.iron).rect(x * S, 0, S / 2, SIGN.top).fill(P.outline);
  const bar = new Sprite(pixelTexture(r, barRows(BAR_W), IRON));
  bar.scale.set(S);
  bar.y = SIGN.top;

  const swing = new Container();
  swing.pivot.set((BAR_W * S) / 2, 0);
  swing.position.set((BAR_W * S) / 2, SIGN.top + 4 * S);
  const chainTex = pixelTexture(r, chainRows(LINKS), IRON);
  for (const x of [BOARD_X + 12, BOARD_X + BOARD_W - 16]) {
    const chain = new Sprite(chainTex);
    chain.scale.set(S);
    chain.x = x * S;
    swing.addChild(chain);
  }

  const board = new Container();
  board.position.set(BOARD_X * S, LINKS * 4 * S);
  const planks = new Sprite(pixelTexture(r, signBoardRows(BOARD_W, BOARD_H), WOOD));
  planks.scale.set(S);
  const name = new Text({
    text: SIGN_NAME,
    style: {
      fontFamily: 'Jacquard 24',
      fontSize: 58,
      fill: P.gold,
      stroke: { color: P.outline, width: 6 },
      dropShadow: { color: P.outline, distance: 4, angle: Math.PI / 4, blur: 0, alpha: 1 },
    },
    resolution: 2,
  });
  name.anchor.set(0.5);
  name.position.set((BOARD_W * S) / 2, BOARD_H * S * 0.42);
  const sub = new Text({
    text: SIGN_SUBTITLE,
    style: { fontFamily: 'Pixelify Sans', fontSize: 22, fill: P.parchment, stroke: { color: P.outline, width: 4 } },
    resolution: 2,
  });
  sub.anchor.set(0.5);
  sub.position.set((BOARD_W * S) / 2, BOARD_H * S * 0.76);
  board.addChild(planks, name, sub);
  swing.addChild(board);

  const boardFilter = new ColorMatrixFilter();
  const glowFilter = new GlowFilter({ distance: 12, outerStrength: 0, innerStrength: 0, color: 0xffc860, quality: 0.2 });
  swing.filters = [boardFilter];
  name.filters = [glowFilter];
  bar.filters = [boardFilter];

  const glowTex = radialTexture(128, [255, 180, 70]);
  const sconceTex = pixelTexture(r, TORCH, IRON_WOOD);
  const flameTex = FLAMES.map((rows) => pixelTexture(r, rows, FLAME));
  const torches: Torch[] = [0, BAR_W - 8].map((px) => {
    const t = new Container();
    t.position.set(px * S, SIGN.top - (TORCH_H + FLAME_H) * S);
    const glow = new Sprite(glowTex);
    glow.anchor.set(0.5);
    glow.scale.set(2.2);
    glow.blendMode = 'add';
    glow.position.set(4 * S, FLAME_H * S * 0.6);
    glow.alpha = 0;
    const flame = new AnimatedSprite(flameTex);
    flame.scale.set(S);
    flame.animationSpeed = 0.12;
    flame.visible = false;
    const sconce = new Sprite(sconceTex);
    sconce.scale.set(S);
    sconce.y = FLAME_H * S;
    t.addChild(glow, flame, sconce);
    return { root: t, flame, glow, x: left + px * S + 4 * S, y: t.y + FLAME_H * S * 0.6 };
  });

  root.addChild(rods, bar, swing, ...torches.map((t) => t.root));
  h.layers.front.addChild(root);

  return {
    root,
    swing,
    board,
    boardFilter,
    glowFilter,
    torches,
    destroy: () => root.destroy({ children: true }),
  };
}
