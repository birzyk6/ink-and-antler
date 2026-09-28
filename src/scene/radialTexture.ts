import { Texture } from 'pixi.js';

/** Soft round glow for torches, forge, bursts. Use with blendMode 'add'. */
export function radialTexture(size: number, [r, g, b]: [number, number, number]): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.9)`);
  grad.addColorStop(0.4, `rgba(${r},${g},${b},0.35)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return Texture.from(canvas);
}
