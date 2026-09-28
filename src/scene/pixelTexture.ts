import { Graphics, Rectangle, type Renderer, type Texture } from 'pixi.js';
import { mapSize, mapToRuns, type Palette } from '../pixel/pixelMap';

/** Bakes a pixel map into a 1-texel-per-pixel texture. Scale it up with sprite.scale. */
export function pixelTexture(renderer: Renderer, rows: readonly string[], palette: Palette): Texture {
  const g = new Graphics();
  for (const r of mapToRuns(rows, palette)) g.rect(r.x, r.y, r.w, 1).fill(r.color);
  const { w, h } = mapSize(rows);
  // An explicit frame keeps transparent edges, so the sprite origin matches the map origin.
  const texture = renderer.generateTexture({ target: g, frame: new Rectangle(0, 0, w, h), resolution: 1 });
  texture.source.scaleMode = 'nearest';
  g.destroy();
  return texture;
}
