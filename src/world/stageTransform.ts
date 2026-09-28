import { MAX_CROP_X, MAX_CROP_Y, WORLD_H, WORLD_W } from './layout';

export interface StageTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

/** Cover the viewport, but never crop more than MAX_CROP_X / MAX_CROP_Y of the world. */
export function computeStageTransform(vw: number, vh: number): StageTransform {
  const cover = Math.max(vw / WORLD_W, vh / WORLD_H);
  const limit = Math.min(vw / (WORLD_W * (1 - MAX_CROP_X)), vh / (WORLD_H * (1 - MAX_CROP_Y)));
  const scale = Math.min(cover, limit);
  return { scale, offsetX: (vw - WORLD_W * scale) / 2, offsetY: (vh - WORLD_H * scale) / 2 };
}

/** CSS transform that places a world-sized DOM box with its top-left at world (x, y). */
export function anchorTransform(t: StageTransform, x: number, y: number): string {
  return `translate(${t.offsetX + x * t.scale}px, ${t.offsetY + y * t.scale}px) scale(${t.scale})`;
}
