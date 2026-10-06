// Cuts a generated walk cycle on magenta into druid_walk1..8.png, scaled and aligned to
// druid_idle1.png so the frames swap without jumping. Takes either one 4×2 sheet, or two
// 4-frame strips (right leg leading, then left leg leading) that get stacked into one.
// Usage: node scripts/cut-walk-sheet.mjs [sheet | stripA stripB] — then `npm run assets`.
import sharp from 'sharp';

const INPUTS = process.argv.length > 2 ? process.argv.slice(2) : ['sprites/gemini/sheet.jpg'];
const OUT = 'sprites/druid';
const COLS = 4;
const ROWS = 2;
const MIN_BLOB = 40;
const CANVAS = 512;

/** How far a pixel leans towards magenta; the druid has no purples, so anything high is backdrop. */
const magenta = (r, g, b) => Math.min(r, b) - g;

async function rgba(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/** Widest horizontal extent of opaque pixels within rows y0..y1. */
function span(alpha, w, y0, y1) {
  let x0 = w, x1 = -1;
  for (let y = y0; y < y1; y++)
    for (let x = 0; x < w; x++) if (alpha(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  return x1 - x0 + 1;
}

function bbox(alpha, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (alpha(x, y)) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x);
        y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Mean x of opaque pixels in the top 35% (antlers, head, owl): legs and staff swing, this doesn't. */
function headX(alpha, b) {
  let sum = 0, n = 0;
  for (let y = b.y0; y < b.y0 + b.h * 0.35; y++)
    for (let x = b.x0; x <= b.x1; x++) if (alpha(x, y)) { sum += x; n++; }
  return sum / n;
}

/** Two strips are scaled to the same width and stacked into a 2-row sheet on magenta. */
async function loadSheet(inputs) {
  if (inputs.length === 1) return rgba(inputs[0]);
  const W = 1024;
  const rows = await Promise.all(inputs.map((p) => sharp(p).resize({ width: W }).flatten({ background: '#ff00ff' }).png().toBuffer({ resolveWithObject: true })));
  const H = Math.max(...rows.map((r) => r.info.height));
  const stacked = await sharp({ create: { width: W, height: H * 2, channels: 3, background: '#ff00ff' } })
    .composite(rows.map((r, i) => ({ input: r.data, left: 0, top: i * H + Math.floor((H - r.info.height) / 2) })))
    .png()
    .toBuffer();
  return rgba(stacked);
}

const sheet = await loadSheet(INPUTS);
const { w: W, h: H, data } = sheet;
const fg = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) fg[i] = magenta(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]) < 50 ? 1 : 0;

// Neighbouring frames overlap in x (staff vs next cloak), so split by connected blobs, not columns.
const label = new Int32Array(W * H).fill(-1);
const blobs = [];
for (let start = 0; start < W * H; start++) {
  if (!fg[start] || label[start] >= 0) continue;
  const id = blobs.length, stack = [start], px = [];
  label[start] = id;
  while (stack.length) {
    const p = stack.pop(); px.push(p);
    const x = p % W, y = (p - x) / W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, q = ny * W + nx;
      if (nx >= 0 && ny >= 0 && nx < W && ny < H && fg[q] && label[q] < 0) { label[q] = id; stack.push(q); }
    }
  }
  blobs.push(px);
}

const CELL_W = W / COLS;
const cell = new Int8Array(W * H).fill(-1);
for (const px of blobs) {
  if (px.length < MIN_BLOB) continue;
  let sx = 0, sy = 0, minX = W, maxX = 0;
  for (const p of px) {
    const x = p % W;
    sx += x; sy += (p - x) / W;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  }
  const row = Math.min(ROWS - 1, Math.floor(sy / px.length / (H / ROWS)));
  if (maxX - minX < CELL_W * 1.2) {
    const col = Math.min(COLS - 1, Math.floor(sx / px.length / CELL_W));
    for (const p of px) cell[p] = row * COLS + col;
    continue;
  }
  // Two frames touch: cut at the thinnest column near each cell boundary.
  const count = new Int32Array(W);
  for (const p of px) count[p % W]++;
  const cuts = [];
  for (let c = 1; c < COLS; c++) {
    let best = Math.round(c * CELL_W);
    for (let x = best - 40; x <= best + 40; x++) if (count[x] < count[best]) best = x;
    cuts.push(best);
  }
  for (const p of px) cell[p] = row * COLS + cuts.filter((cx) => p % W >= cx).length;
}

// A cut can leave a sliver of the neighbour's staff behind: keep only sizeable pieces per frame.
for (let f = 0; f < COLS * ROWS; f++) {
  const seen = new Uint8Array(W * H), pieces = [];
  for (let start = 0; start < W * H; start++) {
    if (cell[start] !== f || seen[start]) continue;
    const stack = [start], px = [];
    seen[start] = 1;
    while (stack.length) {
      const p = stack.pop(); px.push(p);
      const x = p % W, y = (p - x) / W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, q = ny * W + nx;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && cell[q] === f && !seen[q]) { seen[q] = 1; stack.push(q); }
      }
    }
    pieces.push(px);
  }
  const biggest = Math.max(...pieces.map((px) => px.length));
  for (const px of pieces) if (px.length < biggest * 0.05) for (const p of px) cell[p] = -1;
}

const frames = [];
for (let f = 0; f < COLS * ROWS; f++) {
  const on = (x, y) => cell[y * W + x] === f;
  const b = bbox(on, W, H);
  const out = Buffer.alloc(b.w * b.h * 4);
  for (let y = 0; y < b.h; y++)
    for (let x = 0; x < b.w; x++) {
      if (!on(b.x0 + x, b.y0 + y)) continue;
      const s = ((b.y0 + y) * W + b.x0 + x) * 4, d = (y * b.w + x) * 4;
      let [r, g, bl] = [data[s], data[s + 1], data[s + 2]];
      const spill = magenta(r, g, bl);
      if (spill > 0) { r -= spill; bl -= spill; } // pull JPEG fringe back off magenta
      out[d] = r; out[d + 1] = g; out[d + 2] = bl; out[d + 3] = 255;
    }
  const local = (x, y) => out[(y * b.w + x) * 4 + 3] > 0;
  frames.push({
    buf: out, w: b.w, h: b.h,
    headX: headX(local, { x0: 0, y0: 0, x1: b.w - 1, w: b.w, h: b.h }),
    // Rigid widths (antler span, torso) catch frames drawn slimmer than the rest.
    girth: (span(local, b.w, 0, Math.round(b.h * 0.07)) + span(local, b.w, Math.round(b.h * 0.45), Math.round(b.h * 0.45) + 1)) / 2,
  });
}

const idle = await rgba(`${OUT}/druid_idle1.png`);
const idleOn = (x, y) => idle.data[(y * idle.w + x) * 4 + 3] > 128;
const ib = bbox(idleOn, idle.w, idle.h);
const idleHead = headX(idleOn, ib);

// Every frame is scaled evenly to idle1's height. Stretching only one axis to even out frames the
// generator drew slimmer made his body change shape mid-stride, so widths are left as drawn.
console.log(`sheet ${W}x${H}, idle bbox ${ib.w}x${ib.h}`);

for (const [i, f] of frames.entries()) {
  const sy = ib.h / f.h;
  const sx = sy;
  const w = Math.round(f.w * sx), h = ib.h;
  const img = await sharp(f.buf, { raw: { width: f.w, height: f.h, channels: 4 } })
    .resize(w, h, { kernel: 'nearest' })
    .png()
    .toBuffer();
  const left = Math.round(idleHead - f.headX * sx);
  const top = ib.y1 + 1 - h;
  if (left < 0 || top < 0 || left + w > CANVAS) throw new Error(`frame ${i + 1} falls off the canvas`);
  await sharp({ create: { width: CANVAS, height: CANVAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: img, left, top }])
    .png()
    .toFile(`${OUT}/druid_walk${i + 1}.png`);
  console.log(`walk${i + 1}: ${w}x${h} at ${left},${top} (scale ${sy.toFixed(3)}, girth ${Math.round(f.girth * sy)})`);
}
