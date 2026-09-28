// Converts the source art in /sprites into web-sized assets in /src/assets.
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';

const SRC = 'sprites';
const OUT = 'src/assets';
const FRAMES = ['idle1', 'idle2', 'walk1', 'walk2', 'walk3', 'walk4'];
// Union bounding box of all druid frames inside their 512×512 canvases.
const CROP = { left: 97, top: 33, width: 323, height: 447 };
const FRAME_H = 224;
const FRAME_W = Math.round((CROP.width * FRAME_H) / CROP.height); // 162

await mkdir(OUT, { recursive: true });

await sharp(`${SRC}/bg/bg.png`).webp({ quality: 80 }).toFile(`${OUT}/bg.webp`);

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

for (const f of ['bg.webp', 'druid.webp']) {
  console.log(f, `${Math.round((await stat(`${OUT}/${f}`)).size / 1024)}KB`);
}
console.log('druid frame', `${FRAME_W}x${FRAME_H}`, 'order', FRAMES.join(','));
