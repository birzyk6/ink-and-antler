// Converts the source art in /sprites into web-sized assets in /src/assets.
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';

const SRC = 'sprites';
const OUT = 'src/assets';
// Only the first generated row (walk1-4): the second row came out drawn at a different size.
const FRAMES = ['idle1', 'idle2', 'walk1', 'walk2', 'walk3', 'walk4'];
// Union bounding box of all druid frames inside their 512×512 canvases.
const CROP = { left: 97, top: 33, width: 323, height: 447 };
const FRAME_H = 224;
const FRAME_W = Math.round((CROP.width * FRAME_H) / CROP.height); // 162

await mkdir(OUT, { recursive: true });

await sharp(`${SRC}/bg/bg.png`).webp({ quality: 80 }).toFile(`${OUT}/bg.webp`);

// Bits of the lower street that stand in front of the upper one, cut out of bg.png and drawn over
// the druid so he walks behind them. Only the top edges need to be exact: below his feet the cut
// just repeats the bg. World px.
const FOREGROUND = [
  // Roof of the fish shop poking up into the upper street.
  [[150, 640], [160, 628], [186, 600], [328, 600], [350, 614], [381, 614], [381, 640]],
  // Railing along the right of the upper street.
  [[1280, 616], [1920, 616], [1920, 640], [1280, 640]],
];
const mask = `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${FOREGROUND.map(
  (p) => `<polygon points="${p.map((q) => q.join(',')).join(' ')}"/>`,
).join('')}</svg>`;
await sharp(`${SRC}/bg/bg.png`)
  .ensureAlpha()
  .composite([{ input: Buffer.from(mask), blend: 'dest-in' }])
  .webp({ quality: 80, alphaQuality: 100 })
  .toFile(`${OUT}/fg.webp`);

const frames = await Promise.all(
  FRAMES.map((f) =>
    sharp(`${SRC}/druid/druid_${f}.png`)
      .extract(CROP)
      .resize(FRAME_W, FRAME_H, { kernel: 'lanczos3' })
      .png()
      .toBuffer(),
  ),
);

await sharp({
  create: { width: FRAME_W * FRAMES.length, height: FRAME_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite(frames.map((input, i) => ({ input, left: i * FRAME_W, top: 0 })))
  .webp({ quality: 90, alphaQuality: 100 })
  .toFile(`${OUT}/druid.webp`);

// The cat is painted into bg.png. Cut it out (flood fill inside its dark outline, plus the outline)
// so the scene can give it a glow. Box and seeds in world px; keep CAT_BOX in sync with layout.ts.
const CAT_BOX = { left: 296, top: 915, width: 96, height: 66 };
const CAT_SEEDS = [[318, 940], [350, 950], [373, 928], [323, 965], [357, 960], [363, 965]];
{
  const { data, info } = await sharp(`${SRC}/bg/bg.png`).extract(CAT_BOX).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const dark = (i) => data[i * 4] * 0.3 + data[i * 4 + 1] * 0.59 + data[i * 4 + 2] * 0.11 < 62;
  const inside = new Uint8Array(w * h);
  const stack = CAT_SEEDS.map(([x, y]) => (y - CAT_BOX.top) * w + (x - CAT_BOX.left));
  while (stack.length) {
    const p = stack.pop();
    if (inside[p] || dark(p)) continue;
    inside[p] = 1;
    const x = p % w, y = (p - x) / w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
  // Keep the outline: dark pixels within 2px of the filled body.
  const keep = inside.slice();
  for (let p = 0; p < w * h; p++) {
    if (inside[p] || !dark(p)) continue;
    const x = p % w, y = (p - x) / w;
    for (let dy = -2; dy <= 2 && !keep[p]; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h && inside[ny * w + nx]) { keep[p] = 1; break; }
      }
  }
  for (let p = 0; p < w * h; p++) data[p * 4 + 3] = keep[p] ? 255 : 0;
  await sharp(data, { raw: { width: w, height: h, channels: 4 } }).webp({ lossless: true }).toFile(`${OUT}/cat.webp`);
}

for (const f of ['bg.webp', 'fg.webp', 'cat.webp', 'druid.webp']) {
  console.log(f, `${Math.round((await stat(`${OUT}/${f}`)).size / 1024)}KB`);
}
console.log('druid frame', `${FRAME_W}x${FRAME_H}`, 'order', FRAMES.join(','));
