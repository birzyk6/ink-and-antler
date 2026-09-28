# The Ink & Antler — POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-screen, pixel-art point-and-click portfolio. Ossian the druid walks into a medieval town, you talk to him, and you win Michał Kulijewicz's CV scroll and motivational letter with d20 checks and a dice game. Both documents then live in a satchel inventory.

**Architecture:** Two layers.
1. **PixiJS 8 canvas** (bottom) draws the world: a 1920×1080 container scaled to the viewport, with the background, druid, sign, torches, signpost, particles and filters. It has no input handling.
2. **React DOM** (top) holds everything interactive or textual: speech bubbles, the druid and signpost click targets, the dialogue, dice, satchel and document viewers. These are accessible, keyboard-friendly and testable.

The scene positions DOM **anchors** (world-sized boxes) over the druid and the signpost on every tick, so React content inside them uses world px. **GSAP** drives timelines and tweens in both layers. Game rules (dice, checks, patrol, particles) are pure TS modules with unit tests. One zustand store holds game state, persists key parts to localStorage, and is the only bridge between the two layers. All copy lives in `src/content`.

**Tech Stack:** React 19, TypeScript, Vite, PixiJS 8, pixi-filters 6, GSAP 3 (+ @gsap/react), zustand (+ persist), Vitest + Testing Library + jsdom, sharp (dev-only asset script). Hosted on Vercel as a static site.

Spec docs: `docs/story.md`, `docs/gameplay.md`, `docs/dice-game.md`, `docs/stack.md`.

## Global Constraints

- Runtime dependencies: `react`, `react-dom`, `zustand`, `pixi.js`, `pixi-filters`, `gsap`, `@gsap/react`. Nothing else without asking.
- Budget: JS < 260 KB gzip; total first load < 1.2 MB.
- Pixi owns pixels, React owns text and input. Never put interactive text inside the canvas.
- Pixel textures use `scaleMode = 'nearest'`; the canvas is created with `antialias: false`.
- Import Pixi from `pixi.js` only inside `src/scene/`. React components and tests outside `src/scene/` must not import Pixi (jsdom has no WebGL).
- One static scene: `100vw × 100vh`, `overflow: hidden`, **no page scroll, no parallax, no camera moves**.
- World coordinates are 1920×1080 (`WORLD_W`/`WORLD_H`). Everything placed in the world uses world px.
- Stage scaling: cover the viewport, but crop at most 20% horizontally / 15% vertically; letterbox beyond that.
- All player-facing copy lives in `src/content/`. The name is the constant `NAME = 'Michał Kulijewicz'`. If a chosen font lacks `ł`, change it there to `'Michal Kulijewicz'` (one line).
- UI strings are in-world ("Roll it up", "Farewell", "Skip the tale →"), never "Close"/"Cancel".
- Fonts (Google Fonts): **Jacquard 24** (titles), **Pixelify Sans** (UI/dialogue), **IM Fell English** (handwritten documents).
- Pixel look: `image-rendering: pixelated`. Use GSAP for one-shot motion (intro, panels, fly-to-satchel, unroll) and CSS `steps()` keyframes only for tiny loops (bob, flicker).
- `prefers-reduced-motion`: typewriter and d20 tumble are instant, GSAP timelines jump to their end (`prefersReducedMotion()`), particles are off, and CSS animations collapse (global rule).
- localStorage access is always wrapped in try/catch (`safeStorage`).
- Dice rules: natural-20 chance **0.45** per d20 check. Origin gives **+3** to one ability. DCs: Persuasion 12, Investigation 14, Sleight of Hand 15, Insight 10, Animal Handling 8. A natural 20 on any check grants **all remaining items**. Pity: +1 reroll after 1 loss, guaranteed win after 2 losses.
- The player can never be locked out of the documents; `Skip the tale →` is always visible.
- Only one NPC (Ossian). No Scribe.

**Out of scope for this plan** (noted in the docs, deliberately cut from the POC): "one game for honour" replay, the sign's click bark, the padlock/chain overlays on stall items, the cat easter egg, sound, the quest log, the real handwritten CV art.

**Visual checks.** Tasks 7–11 end with a visual check. Run `npm run dev` and open http://localhost:5173. If you're an agent without a browser, run `npx -y playwright@1 install chromium` once, then `npx -y playwright@1 screenshot --viewport-size=1920,1080 --wait-for-timeout=6000 http://localhost:5173 /tmp/shot.png` and Read the PNG.

---

### Task 1: Scaffold project

**Files:**
- Create: `package.json` (via npm), `.gitignore`, `tsconfig.json`, `vite.config.ts`, `vercel.json`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `src/styles/global.css`
- Create: `src/test/setup.ts`, `src/test/rng.ts`
- Test: `src/test/rng.test.ts`

**Interfaces:**
- Produces: test helpers `seq(...values: number[]): () => number` (cycles through values), `face(f: number): number` (an rng value that `1 + floor(v*6)` maps to face `f`), `d20(r: number): number[]` (rng values that make `rollD20` return `r`). CSS tokens in `global.css`: `--outline --wood-dark --wood --wood-light --gold --gold-dark --parchment --parchment-dark --ink --red --letterbox --font-ui --font-title --font-hand`. Classes `.sr-only .px-panel .px-parchment .px-btn .px-btn--gold .px-btn--small`. Keyframes `spin`, `flicker`.

- [ ] **Step 1: Init git and npm**

```bash
cd /Users/bartek/michuLarian
git init -b main
npm init -y
npm pkg set name=ink-and-antler private=true type=module
npm pkg delete main
npm pkg set scripts.dev="vite" scripts.build="tsc && vite build" scripts.preview="vite preview" scripts.test="vitest run" scripts.assets="node scripts/build-assets.mjs"
npm i react react-dom zustand pixi.js pixi-filters gsap @gsap/react
npm i -D vite @vitejs/plugin-react typescript vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @types/react @types/react-dom @types/node sharp
```

- [ ] **Step 2: Write config files**

`.gitignore`:
```
node_modules
dist
.vercel
.DS_Store
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true
  },
  "include": ["src", "vite.config.ts"]
}
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
```

`vercel.json`:
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>The Ink &amp; Antler — Michał Kulijewicz, Writer</title>
    <meta name="description" content="Portfolio of Michał Kulijewicz, writer. Meet Ossian the druid, roll the dice, and win the scroll and the letter." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Jacquard+24&family=Pixelify+Sans:wght@400;600&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx` (temporary, replaced in Task 7):
```tsx
export default function App() {
  return <h1>The Ink &amp; Antler</h1>;
}
```

`src/styles/global.css`:
```css
:root {
  --outline: #1b1210;
  --wood-dark: #4a2c1a;
  --wood: #7a4a2a;
  --wood-light: #a8703f;
  --gold: #e8b04a;
  --gold-dark: #a8741e;
  --parchment: #f1dfb4;
  --parchment-dark: #caa66a;
  --ink: #2b1a10;
  --red: #a8322a;
  --letterbox: #140d0a;
  --font-ui: 'Pixelify Sans', system-ui, sans-serif;
  --font-title: 'Jacquard 24', 'Pixelify Sans', serif;
  --font-hand: 'IM Fell English', Georgia, serif;
}

*, *::before, *::after { box-sizing: border-box; }
html, body, #root { margin: 0; height: 100%; }
body {
  background: var(--letterbox);
  color: var(--parchment);
  font-family: var(--font-ui);
  font-size: 18px;
  overflow: hidden;
  -webkit-font-smoothing: none;
}
img, svg { display: block; image-rendering: pixelated; }
button { font: inherit; color: inherit; }
:focus-visible { outline: 4px solid var(--gold); }

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

.px-panel {
  background: var(--wood);
  color: var(--parchment);
  border: 4px solid var(--outline);
  box-shadow: inset 0 0 0 4px var(--wood-light), inset 0 0 0 8px var(--wood-dark), 0 8px 0 rgb(0 0 0 / 0.35);
}
.px-parchment {
  background: var(--parchment);
  color: var(--ink);
  border: 4px solid var(--outline);
  box-shadow: inset 0 0 0 4px var(--parchment-dark), 0 6px 0 rgb(0 0 0 / 0.3);
}
.px-btn {
  display: inline-block;
  background: var(--wood-dark);
  color: var(--parchment);
  border: 4px solid var(--outline);
  box-shadow: inset -4px -4px 0 rgb(0 0 0 / 0.35), inset 4px 4px 0 rgb(255 255 255 / 0.12);
  padding: 6px 14px;
  cursor: pointer;
  text-decoration: none;
  line-height: 1.2;
}
.px-btn:hover, .px-btn:focus-visible { background: var(--wood); outline: 4px solid var(--gold); outline-offset: 0; }
.px-btn:disabled { opacity: 0.5; cursor: default; outline: none; }
.px-btn--gold { background: var(--gold-dark); color: #fff6dc; }
.px-btn--small { font-size: 14px; padding: 4px 10px; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes flicker { to { opacity: 0.75; transform: scale(0.95); } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Write the failing test for the rng helpers**

`src/test/rng.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { d20, face, seq } from './rng';

describe('test rng helpers', () => {
  it('seq cycles through its values', () => {
    const rng = seq(0.1, 0.2);
    expect([rng(), rng(), rng()]).toEqual([0.1, 0.2, 0.1]);
  });

  it('face(f) maps to die face f', () => {
    for (let f = 1; f <= 6; f++) expect(1 + Math.floor(face(f) * 6)).toBe(f);
  });

  it('d20(r) yields values that pick roll r', () => {
    expect(d20(20)).toEqual([0.1]);
    for (let r = 1; r <= 19; r++) {
      const [gate, pick] = d20(r);
      expect(gate).toBeGreaterThanOrEqual(0.45);
      expect(1 + Math.floor(pick * 19)).toBe(r);
    }
  });
});
```

- [ ] **Step 4: Run it to verify it fails**

Run: `npm test`
Expected: FAIL, "Failed to resolve import './rng'".

- [ ] **Step 5: Implement the helpers**

`src/test/rng.ts`:
```ts
/** Deterministic rng that cycles through the given values. */
export function seq(...values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

/** rng value that rollDie() turns into face f (1–6). */
export const face = (f: number): number => (f - 0.5) / 6;

/** rng values that rollD20() turns into roll r (1–20). Natural 20 uses the 45% gate. */
export const d20 = (r: number): number[] => (r === 20 ? [0.1] : [0.9, (r - 0.5) / 19]);
```

- [ ] **Step 6: Verify tests and build pass**

Run: `npm test && npm run build`
Expected: 3 tests PASS; build writes `dist/`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS project with Vitest"
```

---

### Task 2: Asset pipeline

The source art is anti-aliased and not on a clean pixel grid, so we downscale with lanczos rather than snapping with nearest-neighbour. The background stays at 1920×1080 as WebP (about 300 KB). The six druid frames are cropped to their shared bounding box (x 97–419, y 33–479 in the 512² frames), scaled to 162×224, and packed into one strip.

**Files:**
- Create: `scripts/build-assets.mjs`
- Generated (committed): `src/assets/bg.webp`, `src/assets/druid.webp`
- Create: `src/npc/druidSheet.ts`
- Modify: `docs/stack.md` (Asset pipeline section)

**Interfaces:**
- Produces: `src/assets/bg.webp` (1920×1080) and `src/assets/druid.webp` (972×224 strip, frame order `idle1, idle2, walk1, walk2, walk3, walk4`). `druidSheet.ts` exports `FRAME_W = 162`, `FRAME_H = 224`, `FRAMES = 6`, `IDLE_FRAMES = [0, 1]`, `WALK_FRAMES = [2, 3, 4, 5]`, `DRUID_SCALE = 0.8`, `DRUID_W`, `DRUID_H`.

- [ ] **Step 1: Write the script**

`scripts/build-assets.mjs`:
```js
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
```

- [ ] **Step 2: Run it**

Run: `npm run assets`
Expected output (sizes ±20%):
```
bg.webp 299KB
druid.webp ~100KB
druid frame 162x224 order idle1,idle2,walk1,walk2,walk3,walk4
```
If `druid.webp` > 200 KB, lower `quality` to 80 and rerun.

- [ ] **Step 3: Write the sheet constants**

`src/npc/druidSheet.ts`:
```ts
/** Layout of src/assets/druid.webp — keep in sync with scripts/build-assets.mjs. */
export const FRAME_W = 162;
export const FRAME_H = 224;
export const FRAMES = 6;
export const IDLE_FRAMES = [0, 1] as const;
export const WALK_FRAMES = [2, 3, 4, 5] as const;

/** On-screen size relative to the sheet. Tune visually against the street. */
export const DRUID_SCALE = 0.8;
export const DRUID_W = Math.round(FRAME_W * DRUID_SCALE);
export const DRUID_H = Math.round(FRAME_H * DRUID_SCALE);
```

- [ ] **Step 4: Update the stack doc**

In `docs/stack.md`, replace the numbered list under "## Asset pipeline (important for weight)" (the 4 items starting "1. Detect/choose the native pixel grid") with:

```markdown
1. The source art is anti-aliased and not on a clean pixel grid, so it is downscaled with lanczos (nearest-neighbour would add jaggies).
2. `bg.png` → `src/assets/bg.webp` at 1920×1080, quality 80 (about 300 KB).
3. Druid frames are cropped to their shared box (97,33 → 323×447), scaled to 162×224 and packed into `src/assets/druid.webp` (6 frames: idle1, idle2, walk1–4).
4. Generated assets are committed, so Vercel doesn't need sharp. Re-run with `npm run assets`.
```

- [ ] **Step 5: Verify the build still passes**

Run: `npm run build`
Expected: success.

- [ ] **Step 6: Commit**

```bash
git add scripts src/assets src/npc/druidSheet.ts docs/stack.md package.json
git commit -m "feat: asset pipeline for background and druid sprite strip"
```

---

### Task 3: Dice and round engine

**Files:**
- Create: `src/game/dice.ts`, `src/game/round.ts`
- Test: `src/game/dice.test.ts`, `src/game/round.test.ts`

**Interfaces:**
- Produces (`dice.ts`): `type Rng = () => number`; `type HandRank = 'triple' | 'run' | 'pair' | 'sum'`; `interface Hand { rank: HandRank; score: number }`; `rollDie(rng): number`; `rollDice(n, rng): number[]`; `evaluateHand(dice: readonly number[]): Hand`; `compareHands(player, ossian, tiesToPlayer: boolean): 'win' | 'lose'`; `ossianHolds(dice): boolean[]`; `rerollUnheld(dice, held, rng): number[]`.
- Produces (`round.ts`): `interface RoundMods { extraRerolls: number; seeOssian: boolean; tiesToPlayer: boolean; plusOneDie: boolean; setOneSix: boolean; ossianExtraReroll: boolean }`; `NO_MODS`; `interface RoundState { ossian: number[]; player: number[]; held: boolean[]; rerollsLeft: number; seeOssian: boolean; tiesToPlayer: boolean; plusOneDie: boolean; forcedWin: boolean }`; `interface RoundResult { outcome: 'win' | 'lose'; player: number[]; ossian: number[]; playerHand: Hand; ossianHand: Hand; pim: boolean }`; `PIM_OSSIAN_DICE = [1, 2, 4]`; `startRound(mods, lossStreak, rng): RoundState`; `toggleHold(s, i): RoundState`; `rerollPlayer(s, rng): RoundState`; `finishRound(s): RoundResult`.

- [ ] **Step 1: Write the failing dice tests**

`src/game/dice.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { face, seq } from '../test/rng';
import { compareHands, evaluateHand, ossianHolds, rerollUnheld, rollDie } from './dice';

describe('rollDie', () => {
  it('maps rng to faces 1–6', () => {
    expect(rollDie(seq(0))).toBe(1);
    expect(rollDie(seq(0.999))).toBe(6);
    expect(rollDie(seq(face(4)))).toBe(4);
  });
});

describe('evaluateHand', () => {
  it('ranks triple > run > pair > sum', () => {
    expect(evaluateHand([6, 6, 6])).toEqual({ rank: 'triple', score: 306 });
    expect(evaluateHand([3, 1, 2])).toEqual({ rank: 'run', score: 203 });
    expect(evaluateHand([2, 5, 2])).toEqual({ rank: 'pair', score: 125 });
    expect(evaluateHand([1, 3, 6])).toEqual({ rank: 'sum', score: 10 });
    const scores = [[1, 1, 1], [4, 5, 6], [6, 6, 5], [6, 5, 3]].map((d) => evaluateHand(d).score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it('breaks pair ties by pair face, then kicker', () => {
    expect(evaluateHand([5, 5, 1]).score).toBeGreaterThan(evaluateHand([4, 4, 6]).score);
    expect(evaluateHand([4, 4, 6]).score).toBeGreaterThan(evaluateHand([4, 4, 5]).score);
  });
});

describe('compareHands', () => {
  it('higher score wins; ties go to Ossian unless tiesToPlayer', () => {
    expect(compareHands([6, 6, 6], [1, 2, 4], false)).toBe('win');
    expect(compareHands([1, 2, 4], [6, 6, 6], false)).toBe('lose');
    expect(compareHands([1, 3, 6], [6, 3, 1], false)).toBe('lose');
    expect(compareHands([1, 3, 6], [6, 3, 1], true)).toBe('win');
  });
});

describe('ossianHolds', () => {
  it('holds triples and runs whole, pairs only, nothing otherwise', () => {
    expect(ossianHolds([2, 3, 4])).toEqual([true, true, true]);
    expect(ossianHolds([5, 5, 5])).toEqual([true, true, true]);
    expect(ossianHolds([4, 1, 4])).toEqual([true, false, true]);
    expect(ossianHolds([1, 3, 6])).toEqual([false, false, false]);
  });
});

describe('rerollUnheld', () => {
  it('rerolls only unheld dice, in order', () => {
    expect(rerollUnheld([1, 2, 3], [true, false, true], seq(face(6)))).toEqual([1, 6, 3]);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/game/dice.test.ts`
Expected: FAIL, "Failed to resolve import './dice'".

- [ ] **Step 3: Implement dice.ts**

`src/game/dice.ts`:
```ts
export type Rng = () => number;
export type HandRank = 'triple' | 'run' | 'pair' | 'sum';
export interface Hand {
  rank: HandRank;
  /** Comparable across ranks: triple 3xx > run 2xx > pair 1xx > sum (3–18). */
  score: number;
}

export function rollDie(rng: Rng): number {
  return 1 + Math.floor(rng() * 6);
}

export function rollDice(n: number, rng: Rng): number[] {
  return Array.from({ length: n }, () => rollDie(rng));
}

export function evaluateHand(dice: readonly number[]): Hand {
  const [a, b, c] = [...dice].sort((x, y) => x - y);
  if (a === c) return { rank: 'triple', score: 300 + a };
  if (b === a + 1 && c === b + 1) return { rank: 'run', score: 200 + c };
  if (a === b || b === c) {
    const kicker = a === b ? c : a;
    return { rank: 'pair', score: 100 + b * 10 + kicker };
  }
  return { rank: 'sum', score: a + b + c };
}

export function compareHands(player: readonly number[], ossian: readonly number[], tiesToPlayer: boolean): 'win' | 'lose' {
  const p = evaluateHand(player).score;
  const o = evaluateHand(ossian).score;
  if (p === o) return tiesToPlayer ? 'win' : 'lose';
  return p > o ? 'win' : 'lose';
}

/** Ossian keeps anything that already scores and rerolls the rest. */
export function ossianHolds(dice: readonly number[]): boolean[] {
  const hand = evaluateHand(dice);
  if (hand.rank === 'triple' || hand.rank === 'run') return dice.map(() => true);
  if (hand.rank === 'pair') {
    const pairFace = Math.floor((hand.score - 100) / 10);
    return dice.map((d) => d === pairFace);
  }
  return dice.map(() => false);
}

export function rerollUnheld(dice: readonly number[], held: readonly boolean[], rng: Rng): number[] {
  return dice.map((d, i) => (held[i] ? d : rollDie(rng)));
}
```

- [ ] **Step 4: Run the dice tests**

Run: `npx vitest run src/game/dice.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing round tests**

`src/game/round.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { face, seq } from '../test/rng';
import { NO_MODS, PIM_OSSIAN_DICE, finishRound, rerollPlayer, startRound, toggleHold, type RoundState } from './round';

const base: RoundState = {
  ossian: [6, 6, 5], player: [1, 2, 3], held: [false, false, false], rerollsLeft: 1,
  seeOssian: false, tiesToPlayer: false, plusOneDie: false, forcedWin: false,
};

describe('startRound', () => {
  it('Ossian rolls and rerolls non-scoring dice, then the player rolls', () => {
    const rng = seq(face(1), face(2), face(4), face(1), face(2), face(4), face(6), face(6), face(6));
    const s = startRound(NO_MODS, 0, rng);
    expect(s.ossian).toEqual([1, 2, 4]);
    expect(s.player).toEqual([6, 6, 6]);
    expect(s.rerollsLeft).toBe(1);
    expect(s.forcedWin).toBe(false);
  });

  it('setOneSix turns the lowest player die into a 6', () => {
    const rng = seq(face(6), face(6), face(6), face(2), face(5), face(3));
    expect(startRound({ ...NO_MODS, setOneSix: true }, 0, rng).player).toEqual([6, 5, 3]);
  });

  it('adds extra rerolls and pity', () => {
    const rng = seq(face(6));
    expect(startRound({ ...NO_MODS, extraRerolls: 1 }, 0, rng).rerollsLeft).toBe(2);
    expect(startRound(NO_MODS, 1, rng).rerollsLeft).toBe(2);
    expect(startRound(NO_MODS, 2, rng).forcedWin).toBe(true);
  });
});

describe('player actions', () => {
  it('toggleHold flips one die', () => {
    expect(toggleHold(base, 1).held).toEqual([false, true, false]);
  });

  it('rerollPlayer rerolls unheld dice and spends a reroll', () => {
    const s = rerollPlayer(toggleHold(base, 1), seq(face(6), face(5)));
    expect(s.player).toEqual([6, 2, 5]);
    expect(s.rerollsLeft).toBe(0);
    expect(rerollPlayer(s, seq(face(1)))).toBe(s);
  });
});

describe('finishRound', () => {
  it('compares hands', () => {
    expect(finishRound({ ...base, player: [6, 6, 6] }).outcome).toBe('win');
    expect(finishRound(base).outcome).toBe('lose');
  });

  it('plusOneDie bumps the lowest die before scoring', () => {
    expect(finishRound({ ...base, player: [1, 5, 5], plusOneDie: true }).player).toEqual([2, 5, 5]);
  });

  it('Pim forces a win after two losses', () => {
    const r = finishRound({ ...base, forcedWin: true });
    expect(r).toMatchObject({ outcome: 'win', pim: true, ossian: PIM_OSSIAN_DICE });
  });
});
```

- [ ] **Step 6: Run them to verify they fail**

Run: `npx vitest run src/game/round.test.ts`
Expected: FAIL, "Failed to resolve import './round'".

- [ ] **Step 7: Implement round.ts**

`src/game/round.ts`:
```ts
import { compareHands, evaluateHand, ossianHolds, rerollUnheld, rollDice, type Hand, type Rng } from './dice';

export interface RoundMods {
  extraRerolls: number;
  seeOssian: boolean;
  tiesToPlayer: boolean;
  plusOneDie: boolean;
  setOneSix: boolean;
  ossianExtraReroll: boolean;
}

export const NO_MODS: RoundMods = {
  extraRerolls: 0, seeOssian: false, tiesToPlayer: false, plusOneDie: false, setOneSix: false, ossianExtraReroll: false,
};

export interface RoundState {
  ossian: number[];
  player: number[];
  held: boolean[];
  rerollsLeft: number;
  seeOssian: boolean;
  tiesToPlayer: boolean;
  plusOneDie: boolean;
  /** Pity: Pim guarantees the win after two losses in a row. */
  forcedWin: boolean;
}

export interface RoundResult {
  outcome: 'win' | 'lose';
  player: number[];
  ossian: number[];
  playerHand: Hand;
  ossianHand: Hand;
  pim: boolean;
}

/** What Ossian's dice look like after Pim knocks them over. */
export const PIM_OSSIAN_DICE = [1, 2, 4];

function lowestIndex(dice: readonly number[]): number {
  return dice.indexOf(Math.min(...dice));
}

export function startRound(mods: RoundMods, lossStreak: number, rng: Rng): RoundState {
  let ossian = rollDice(3, rng);
  ossian = rerollUnheld(ossian, ossianHolds(ossian), rng);
  if (mods.ossianExtraReroll) ossian = rerollUnheld(ossian, ossianHolds(ossian), rng);
  const player = rollDice(3, rng);
  if (mods.setOneSix) player[lowestIndex(player)] = 6;
  return {
    ossian,
    player,
    held: [false, false, false],
    rerollsLeft: 1 + mods.extraRerolls + (lossStreak === 1 ? 1 : 0),
    seeOssian: mods.seeOssian,
    tiesToPlayer: mods.tiesToPlayer,
    plusOneDie: mods.plusOneDie,
    forcedWin: lossStreak >= 2,
  };
}

export function toggleHold(s: RoundState, i: number): RoundState {
  return { ...s, held: s.held.map((h, j) => (j === i ? !h : h)) };
}

export function rerollPlayer(s: RoundState, rng: Rng): RoundState {
  if (s.rerollsLeft <= 0) return s;
  return { ...s, player: rerollUnheld(s.player, s.held, rng), rerollsLeft: s.rerollsLeft - 1 };
}

export function finishRound(s: RoundState): RoundResult {
  const player = [...s.player];
  if (s.plusOneDie) {
    const i = lowestIndex(player);
    player[i] = Math.min(6, player[i] + 1);
  }
  const outcome = compareHands(player, s.ossian, s.tiesToPlayer);
  if (outcome === 'lose' && s.forcedWin) {
    const ossian = [...PIM_OSSIAN_DICE];
    return { outcome: 'win', player, ossian, playerHand: evaluateHand(player), ossianHand: evaluateHand(ossian), pim: true };
  }
  return { outcome, player, ossian: s.ossian, playerHand: evaluateHand(player), ossianHand: evaluateHand(s.ossian), pim: false };
}
```

- [ ] **Step 8: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/game
git commit -m "feat: knucklebones dice and round engine"
```

---

### Task 4: Ability checks and the weighted d20

**Files:**
- Create: `src/game/checks.ts`, `src/game/d20.ts`
- Test: `src/game/checks.test.ts`

**Interfaces:**
- Consumes: `RoundMods` from `round.ts`, `Rng` from `dice.ts`.
- Produces (`checks.ts`): `type Ability = 'CHA' | 'INT' | 'DEX' | 'WIS'`; `ABILITIES`; `type CheckId = 'persuasion' | 'investigation' | 'sleight' | 'insight' | 'animal'`; `CHECKS: Record<CheckId, { ability; skill; dc }>`; `CHECK_ORDER`; `ORIGIN_BONUS = 3`; `modifierFor(origin: Ability | null, ability: Ability): number`; `applyCheck(mods, id, success): RoundMods`.
- Produces (`d20.ts`): `NAT20_CHANCE = 0.45`; `rollD20(rng): number`; `interface CheckResult { roll; modifier; dc; total; success; natural: 1 | 20 | null }`; `resolveCheck(roll, modifier, dc): CheckResult`.

- [ ] **Step 1: Write the failing tests**

`src/game/checks.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { d20, seq } from '../test/rng';
import { CHECKS, applyCheck, modifierFor } from './checks';
import { NAT20_CHANCE, resolveCheck, rollD20 } from './d20';
import { NO_MODS } from './round';

describe('rollD20', () => {
  it('rolls a natural 20 through the weighted gate', () => {
    expect(rollD20(seq(...d20(20)))).toBe(20);
  });

  it('otherwise rolls 1–19', () => {
    expect(rollD20(seq(...d20(1)))).toBe(1);
    expect(rollD20(seq(...d20(19)))).toBe(19);
    expect(rollD20(seq(0.9, 0.999))).toBe(19);
  });

  it('lands on 20 about 45% of the time', () => {
    let twenties = 0;
    for (let i = 0; i < 20000; i++) if (rollD20(Math.random) === 20) twenties++;
    expect(twenties / 20000).toBeGreaterThan(NAT20_CHANCE - 0.03);
    expect(twenties / 20000).toBeLessThan(NAT20_CHANCE + 0.03);
  });
});

describe('resolveCheck', () => {
  it('adds the modifier and compares to DC', () => {
    expect(resolveCheck(15, 3, 12)).toEqual({ roll: 15, modifier: 3, dc: 12, total: 18, success: true, natural: null });
    expect(resolveCheck(10, 0, 12).success).toBe(false);
  });

  it('natural 1 always fails, natural 20 always succeeds', () => {
    expect(resolveCheck(1, 3, 2)).toMatchObject({ success: false, natural: 1 });
    expect(resolveCheck(20, 0, 30)).toMatchObject({ success: true, natural: 20 });
  });
});

describe('modifiers and effects', () => {
  it('origin grants +3 to its ability only', () => {
    expect(modifierFor('CHA', 'CHA')).toBe(3);
    expect(modifierFor('INT', 'CHA')).toBe(0);
    expect(modifierFor(null, 'WIS')).toBe(0);
  });

  it('uses the DCs from the spec', () => {
    expect(Object.fromEntries(Object.entries(CHECKS).map(([k, v]) => [k, v.dc]))).toEqual({
      persuasion: 12, investigation: 14, sleight: 15, insight: 10, animal: 8,
    });
  });

  it('applies success effects', () => {
    expect(applyCheck(NO_MODS, 'persuasion', true).extraRerolls).toBe(1);
    expect(applyCheck(NO_MODS, 'investigation', true).plusOneDie).toBe(true);
    expect(applyCheck(NO_MODS, 'sleight', true).setOneSix).toBe(true);
    expect(applyCheck(NO_MODS, 'insight', true).seeOssian).toBe(true);
    expect(applyCheck(NO_MODS, 'animal', true).tiesToPlayer).toBe(true);
  });

  it('only a failed sleight of hand has a penalty', () => {
    expect(applyCheck(NO_MODS, 'sleight', false).ossianExtraReroll).toBe(true);
    expect(applyCheck(NO_MODS, 'insight', false)).toEqual(NO_MODS);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/game/checks.test.ts`
Expected: FAIL, "Failed to resolve import './checks'".

- [ ] **Step 3: Implement checks.ts**

`src/game/checks.ts`:
```ts
import type { RoundMods } from './round';

export type Ability = 'CHA' | 'INT' | 'DEX' | 'WIS';
export const ABILITIES: readonly Ability[] = ['CHA', 'INT', 'DEX', 'WIS'];

export type CheckId = 'persuasion' | 'investigation' | 'sleight' | 'insight' | 'animal';

export interface CheckDef {
  ability: Ability;
  skill: string;
  dc: number;
}

export const CHECKS: Record<CheckId, CheckDef> = {
  persuasion: { ability: 'CHA', skill: 'Persuasion', dc: 12 },
  investigation: { ability: 'INT', skill: 'Investigation', dc: 14 },
  sleight: { ability: 'DEX', skill: 'Sleight of Hand', dc: 15 },
  insight: { ability: 'WIS', skill: 'Insight', dc: 10 },
  animal: { ability: 'WIS', skill: 'Animal Handling', dc: 8 },
};

export const CHECK_ORDER: readonly CheckId[] = ['persuasion', 'investigation', 'sleight', 'insight', 'animal'];

export const ORIGIN_BONUS = 3;

export function modifierFor(origin: Ability | null, ability: Ability): number {
  return origin === ability ? ORIGIN_BONUS : 0;
}

export function applyCheck(mods: RoundMods, id: CheckId, success: boolean): RoundMods {
  if (!success) return id === 'sleight' ? { ...mods, ossianExtraReroll: true } : mods;
  switch (id) {
    case 'persuasion':
      return { ...mods, extraRerolls: mods.extraRerolls + 1 };
    case 'investigation':
      return { ...mods, plusOneDie: true };
    case 'sleight':
      return { ...mods, setOneSix: true };
    case 'insight':
      return { ...mods, seeOssian: true };
    case 'animal':
      return { ...mods, tiesToPlayer: true };
  }
}
```

- [ ] **Step 4: Implement d20.ts**

`src/game/d20.ts`:
```ts
import type { Rng } from './dice';

/** Rigged on purpose: most players see a natural 20 in their first or second check. */
export const NAT20_CHANCE = 0.45;

export function rollD20(rng: Rng): number {
  if (rng() < NAT20_CHANCE) return 20;
  return 1 + Math.floor(rng() * 19);
}

export interface CheckResult {
  roll: number;
  modifier: number;
  dc: number;
  total: number;
  success: boolean;
  natural: 1 | 20 | null;
}

export function resolveCheck(roll: number, modifier: number, dc: number): CheckResult {
  const total = roll + modifier;
  return {
    roll,
    modifier,
    dc,
    total,
    success: roll === 20 || (roll !== 1 && total >= dc),
    natural: roll === 20 ? 20 : roll === 1 ? 1 : null,
  };
}
```

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game
git commit -m "feat: ability checks and weighted d20"
```

---

### Task 5: Content and game store

**Files:**
- Create: `src/game/items.ts`, `src/content/copy.ts`, `src/content/documents.ts`, `src/game/store.ts`
- Test: `src/game/store.test.ts`

**Interfaces:**
- Consumes: Tasks 3–4 (`startRound`, `finishRound`, `rerollPlayer`, `toggleHold`, `NO_MODS`, `RoundState`, `RoundResult`, `CHECKS`, `applyCheck`, `modifierFor`, `Ability`, `CheckId`, `rollD20`, `resolveCheck`, `Rng`).
- Produces:
  - `items.ts`: `type ItemId = 'cv' | 'letter'`, `ALL_ITEMS`.
  - `copy.ts`: `NAME`, `FIRST_NAME`, `SIGN_NAME`, `SIGN_SUBTITLE`, `CONTACT`, `CV_PDF_URL`, `copy` (all strings), `items` (item cards).
  - `documents.ts`: `CV`, `MOTIVATION_LETTER`.
  - `store.ts`: `useGame` (zustand hook), `INITIAL`, `remainingItems(inventory)`, `type DruidScene = 'offstage' | 'entering' | 'greeting' | 'waiting' | 'patrolling'`, `type DialogueNode`, `type GameState`, `selectDruidHold(s): boolean`. Actions: `setDruid, startDruidEntrance, druidArrived, greetingDone, talk, clearBark, chooseOrigin, chooseWager, askAbout, backToWager, chooseCheck, justRoll, continueAfterRoll, toggleHold, reroll, revealRound, continueDialogue, closeDialogue, ackReceived, setSatchelOpen, viewItem, setContactOpen, skipTale, resetTale`. Session field `celebrate: number` (a counter bumped on every natural 20; the scene plays its burst when it changes).

- [ ] **Step 1: Write items and content**

`src/game/items.ts`:
```ts
export type ItemId = 'cv' | 'letter';
export const ALL_ITEMS: readonly ItemId[] = ['cv', 'letter'];
```

`src/content/copy.ts`:
```ts
import type { Ability, CheckId } from '../game/checks';
import type { HandRank } from '../game/dice';
import type { ItemId } from '../game/items';

/** If a chosen font has no "ł", change this to 'Michal Kulijewicz'. */
export const NAME = 'Michał Kulijewicz';
export const FIRST_NAME = NAME.split(' ')[0];
export const SIGN_NAME = 'The Ink & Antler';
export const SIGN_SUBTITLE = `Home of ${NAME}, Writer`;

/** Replace with real details before sending. */
export const CONTACT = { email: 'hello@example.com', linkedin: 'https://www.linkedin.com/' };
/** Set to e.g. '/michal-kulijewicz-cv.pdf' once that file exists in /public. */
export const CV_PDF_URL: string | null = null;

export const items: Record<ItemId, { name: string; rarity: 'Legendary' | 'Rare'; flavour: string; weight: number }> = {
  cv: { name: 'Scroll of Curriculum Vitae', rarity: 'Legendary', flavour: 'Contains one (1) writer. Handle with interest.', weight: 0.1 },
  letter: { name: 'Sealed Letter of Motivation', rarity: 'Rare', flavour: 'Warm to the touch. Someone meant every word.', weight: 0.05 },
};

export const copy = {
  loading: 'Rolling for initiative…',
  greeting: [
    'Hail, traveller. You have the look of someone searching for a writer.',
    'Fortunately, I have the look of someone guarding one.',
  ],
  hint: 'Click the druid to speak.',
  nudge: "Pim says you're allowed to click. Pim is rarely wrong.",
  satchelHint: 'Open your satchel to read it.',
  originPrompt: 'Before we trade words — who approaches?',
  origins: {
    CHA: { label: 'A recruiter, from a studio in Ghent.', reply: 'Ghent! Pim — the good dice. The ones without the dent.' },
    INT: { label: 'A scholar. I read the fine print.', reply: "Then you'll enjoy these dice. They have very fine print." },
    DEX: { label: 'Nobody. Just passing through.', reply: 'Nobody has quick fingers. Keep them where Pim can see them.' },
    WIS: { label: 'An old friend of the forest.', reply: "Pim doesn't remember you. Pim remembers everyone. Interesting." },
  } satisfies Record<Ability, { label: string; reply: string }>,
  wagerPrompt: [
    `Two treasures. The deeds of ${NAME}, written in a steady hand — and a letter, sealed, that explains why.`,
    'Sell them? Coin is dull. Chance has manners. Which will you play for?',
  ],
  wagerAgain: 'One treasure left. Same terms. Which will you play for?',
  wagerChoice: { cv: 'The scroll.', letter: 'The letter.' } satisfies Record<ItemId, string>,
  about: "What's on them?",
  aboutReply: [
    `The scroll: where ${FIRST_NAME} has been, what's been written, which quests were survived.`,
    "The letter: the part that can't fit on a scroll. Pim has read both. Pim wept. Pim denies this.",
  ],
  back: 'Back to the wager.',
  farewell: 'Not today.',
  farewellFinal: 'Farewell.',
  checkPrompt: 'Before the bones fall — care to tip the odds?',
  justRoll: 'Just roll the bones.',
  checks: {
    persuasion: { label: 'Surely a guest rolls first. And twice?', success: 'Fine. Roll twice. Pim, stop looking at me like that.', fail: 'A guest, yes. A fool, no.' },
    investigation: { label: 'Let me take a look at those dice.', success: '…Ah. That one is loaded. It must have wandered in from another table. Swap it.', fail: "They're dice. They have dots. Well spotted." },
    sleight: { label: 'Palm a die of your own.', success: 'Ossian notices nothing. Pim notices everything, and says nothing.', fail: 'Pim screeches. "Pim saw that. Pim respects it. Pim is also telling everyone."' },
    insight: { label: 'Watch his eyes as he rolls.', success: 'He glances at his dice twice. Now you know what he holds.', fail: "He blinks a lot. Then again, he's a druid." },
    animal: { label: 'Offer Pim a crumb of bread.', success: 'Pim accepts. Pim is now on your side of the table.', fail: 'Pim eats the crumb and gives nothing back. Classic Pim.' },
  } satisfies Record<CheckId, { label: string; success: string; fail: string }>,
  effects: {
    persuasion: '+1 reroll',
    investigation: '+1 to your lowest die',
    sleight: 'one of your dice becomes a 6',
    insight: "you see Ossian's dice",
    animal: 'ties go to you',
  } satisfies Record<CheckId, string>,
  nat1: 'A natural one. The bones wince.',
  rollContinue: 'Let the bones fall.',
  nat20: {
    both: [
      '…Twenty. Twenty. Pim, did you sell them the good die again?',
      'Fine. Fine! Take both. The scroll and the letter. A roll like that deserves the whole chronicle.',
    ],
    last: ["Twenty! Take the other one too — I mean, it's the only one left, but take it triumphantly."],
    take: 'Take them.',
  },
  dice: {
    ossian: 'Ossian',
    you: 'You',
    reroll: (n: number) => `Reroll unheld (${n} left)`,
    reveal: 'Reveal the bones',
    holdHint: 'Click your dice to hold them, then reroll the rest — or reveal.',
  },
  hands: { triple: 'Three of a kind', run: 'A run', pair: 'A pair', sum: 'Only the sum' } satisfies Record<HandRank, string>,
  win: 'The bones have spoken. They said your name, which is rude of them.',
  triple: "Three of a kind! Pim, write this down. Pim can't write. Remember it, then.",
  pim: '…Pim has overruled me. Pim is the senior partner.',
  lose: "The bones have spoken. They said 'no'. They often do.",
  rematch: 'Again. The bones were still waking up.',
  again: 'Again.',
  takeIt: 'Take it.',
  wonItem: (name: string) => `The ${name} is yours.`,
  received: (name: string) => `${name} added to your satchel.`,
  afterReceive: 'Read it somewhere dry. The ink runs when people cry at the good parts.',
  epilogue: [
    "Two for two. Pim, we've been hustled.",
    `When you're done reading, the signpost by the stairs knows how to reach ${FIRST_NAME}. Pim does not endorse visiting. Pim does not endorse anything.`,
  ],
  barks: [
    'Already lost the best things I own. The owl is not for sale.',
    `${FIRST_NAME} once described a sunset so well the sun came back to listen.`,
    'If Ghent sends a cart, tell them Pim travels free.',
  ],
  druidLabel: 'Talk to Ossian the druid',
  satchel: { title: 'Satchel', empty: 'Empty. For now.', open: 'Open satchel', weight: 'Weight' },
  viewer: { close: 'Roll it up', closeLetter: 'Fold it away', pdf: 'Take a copy (PDF)' },
  contact: {
    title: 'The Signpost',
    intro: `To reach ${NAME}:`,
    email: 'By raven (email)',
    linkedin: 'By the guild registry (LinkedIn)',
    close: 'Farewell',
    label: 'Read the signpost',
  },
  skip: 'Skip the tale →',
  reset: 'Begin anew',
  portraitGate: { text: 'The town is wider than your screen. Turn your device sideways, traveller.', anyway: 'Read the scroll anyway' },
};
```

`src/content/documents.ts`:
```ts
import { NAME } from './copy';

export interface DocSection {
  heading: string;
  lines: string[];
}

/** PLACEHOLDER CV: replace the bracketed lines with the real CV. */
export const CV: { title: string; subtitle: string; sections: DocSection[] } = {
  title: NAME,
  subtitle: 'Writer · Teller of Tales · Weaver of Quests',
  sections: [
    { heading: 'Deeds', lines: ['[Role] — [Studio], [years]', '[Quest & dialogue writing for project]', '[Worldbuilding for project]'] },
    { heading: 'Tomes', lines: ['[Short story], [publication], [year]', '[Interactive fiction], [platform], [year]'] },
    { heading: 'Tongues', lines: ['Polish — native', 'English — fluent'] },
    { heading: 'Crafts', lines: ['Branching dialogue', 'Character voice', 'Barks & systemic lines', 'Ink / Twine / articy:draft'] },
  ],
};

/** PLACEHOLDER letter: replace the paragraphs with the real letter. */
export const MOTIVATION_LETTER = {
  salutation: 'To the good people of Larian,',
  paragraphs: [
    '[Placeholder — the real letter goes here.] I have spent years learning how one line of dialogue can make a player laugh, hesitate, or reload a save just to hear it again.',
    'Your worlds are the ones I measure my own writing against: characters who want things, choices that answer back, and jokes that are allowed to hurt a little.',
  ],
  signoff: 'Yours, in ink and earnest,',
  signature: NAME,
};
```

- [ ] **Step 2: Write the failing store tests**

`src/game/store.test.ts`:
```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { copy } from '../content/copy';
import { d20, face, seq } from '../test/rng';
import { INITIAL, selectDruidHold, useGame } from './store';

const g = () => useGame.getState();

beforeEach(() => {
  localStorage.clear();
  useGame.setState({ ...INITIAL, druid: 'waiting' });
});

describe('druid scene', () => {
  it('enters, greets, then waits', () => {
    useGame.setState({ druid: 'offstage' });
    g().startDruidEntrance();
    expect(g().druid).toBe('entering');
    g().druidArrived();
    expect(g().druid).toBe('greeting');
    g().greetingDone();
    expect(g()).toMatchObject({ druid: 'waiting', introSeen: true });
  });

  it('holds the druid still while entering, greeting, waiting or talking', () => {
    expect(selectDruidHold({ ...g(), druid: 'waiting' })).toBe(true);
    expect(selectDruidHold({ ...g(), druid: 'patrolling', node: null })).toBe(false);
    expect(selectDruidHold({ ...g(), druid: 'patrolling', node: { id: 'origin' } })).toBe(true);
  });
});

describe('dialogue flow', () => {
  it('ignores clicks while the druid is not on stage', () => {
    useGame.setState({ druid: 'entering' });
    g().talk();
    expect(g().node).toBeNull();
  });

  it('asks for an origin first, then the wager', () => {
    g().talk();
    expect(g().node).toEqual({ id: 'origin' });
    g().chooseOrigin('CHA');
    expect(g()).toMatchObject({ origin: 'CHA', node: { id: 'wager', afterOrigin: 'CHA' } });
  });

  it('wins a round after a successful check', () => {
    g().talk();
    g().chooseOrigin('CHA');
    g().chooseWager('cv');
    useGame.setState({
      rng: seq(...d20(15), face(1), face(2), face(4), face(1), face(2), face(4), face(6), face(6), face(6)),
    });
    g().chooseCheck('persuasion');
    expect(g().node).toMatchObject({ id: 'rolling', roll: 15, modifier: 3, dc: 12, success: true });
    g().continueAfterRoll();
    expect(g().node).toEqual({ id: 'dice', wager: 'cv' });
    expect(g().round?.rerollsLeft).toBe(2);
    g().revealRound();
    expect(g().node).toMatchObject({ id: 'roundWon', wager: 'cv' });
    expect(g().inventory).toEqual(['cv']);
    expect(g().justReceived).toEqual(['cv']);
    g().continueDialogue();
    expect(g().node).toEqual({ id: 'wager', afterOrigin: null });
  });

  it('a natural 20 grants everything, bumps celebrate, then ends the tale', () => {
    useGame.setState({ origin: 'WIS', node: { id: 'check', wager: 'letter' }, rng: seq(...d20(20)) });
    g().chooseCheck('insight');
    g().continueAfterRoll();
    expect(g().inventory).toEqual(['cv', 'letter']);
    expect(g().node).toEqual({ id: 'nat20', items: ['cv', 'letter'] });
    expect(g().celebrate).toBe(1);
    g().continueDialogue();
    expect(g().node).toEqual({ id: 'epilogue' });
    g().continueDialogue();
    expect(g()).toMatchObject({ node: null, druid: 'patrolling' });
  });

  it('a loss offers a rematch with a fresh check', () => {
    useGame.setState({
      origin: 'INT',
      node: { id: 'check', wager: 'letter' },
      rng: seq(face(6), face(6), face(6), face(1), face(2), face(4)),
    });
    g().justRoll();
    g().revealRound();
    expect(g()).toMatchObject({ lossStreak: 1, node: { id: 'roundLost', wager: 'letter' } });
    g().continueDialogue();
    expect(g().node).toEqual({ id: 'check', wager: 'letter' });
  });

  it('once everything is won, clicking the druid cycles barks', () => {
    useGame.setState({ inventory: ['cv', 'letter'], druid: 'patrolling' });
    g().talk();
    expect(g().bark).toBe(copy.barks[0]);
    g().clearBark();
    g().talk();
    expect(g().bark).toBe(copy.barks[1]);
    expect(g().node).toBeNull();
  });
});

describe('satchel and persistence', () => {
  it('flags the first viewing of an item', () => {
    useGame.setState({ inventory: ['letter'] });
    g().viewItem('letter');
    expect(g()).toMatchObject({ viewing: 'letter', viewingFirstTime: true, opened: ['letter'] });
    g().viewItem(null);
    g().viewItem('letter');
    expect(g().viewingFirstTime).toBe(false);
  });

  it('skipTale grants both documents and opens the CV', () => {
    g().skipTale();
    expect(g()).toMatchObject({ inventory: ['cv', 'letter'], viewing: 'cv', introSeen: true });
  });

  it('persists only the durable fields', () => {
    g().talk();
    g().chooseOrigin('DEX');
    g().skipTale();
    const saved = JSON.parse(localStorage.getItem('ink-antler-v1')!).state;
    expect(saved).toEqual({ origin: 'DEX', inventory: ['cv', 'letter'], opened: ['cv'], introSeen: true, contactSeen: false });
  });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `npx vitest run src/game/store.test.ts`
Expected: FAIL, "Failed to resolve import './store'".

- [ ] **Step 4: Implement the store**

`src/game/store.ts`:
```ts
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { copy } from '../content/copy';
import { CHECKS, applyCheck, modifierFor, type Ability, type CheckId } from './checks';
import { resolveCheck, rollD20 } from './d20';
import type { Rng } from './dice';
import { ALL_ITEMS, type ItemId } from './items';
import { NO_MODS, finishRound, rerollPlayer, startRound, toggleHold as toggleHeld, type RoundResult, type RoundState } from './round';

export type DruidScene = 'offstage' | 'entering' | 'greeting' | 'waiting' | 'patrolling';

export type DialogueNode =
  | { id: 'origin' }
  | { id: 'wager'; afterOrigin: Ability | null }
  | { id: 'about' }
  | { id: 'check'; wager: ItemId }
  | { id: 'rolling'; wager: ItemId; check: CheckId; roll: number; modifier: number; dc: number; success: boolean }
  | { id: 'nat20'; items: ItemId[] }
  | { id: 'dice'; wager: ItemId }
  | { id: 'roundWon'; wager: ItemId; result: RoundResult }
  | { id: 'roundLost'; wager: ItemId; result: RoundResult }
  | { id: 'epilogue' };

interface Persisted {
  origin: Ability | null;
  inventory: ItemId[];
  opened: ItemId[];
  introSeen: boolean;
  contactSeen: boolean;
}

interface Session {
  druid: DruidScene;
  node: DialogueNode | null;
  round: RoundState | null;
  lossStreak: number;
  usedChecks: CheckId[];
  justReceived: ItemId[];
  satchelOpen: boolean;
  viewing: ItemId | null;
  viewingFirstTime: boolean;
  contactOpen: boolean;
  bark: string | null;
  barkIndex: number;
  /** Bumped on every natural 20; the scene plays its celebration when it changes. */
  celebrate: number;
  rng: Rng;
}

interface Actions {
  setDruid: (druid: DruidScene) => void;
  startDruidEntrance: () => void;
  druidArrived: () => void;
  greetingDone: () => void;
  talk: () => void;
  clearBark: () => void;
  chooseOrigin: (origin: Ability) => void;
  chooseWager: (wager: ItemId) => void;
  askAbout: () => void;
  backToWager: () => void;
  chooseCheck: (check: CheckId) => void;
  justRoll: () => void;
  continueAfterRoll: () => void;
  toggleHold: (i: number) => void;
  reroll: () => void;
  revealRound: () => void;
  continueDialogue: () => void;
  closeDialogue: () => void;
  ackReceived: () => void;
  setSatchelOpen: (open: boolean) => void;
  viewItem: (id: ItemId | null) => void;
  setContactOpen: (open: boolean) => void;
  skipTale: () => void;
  resetTale: () => void;
}

export type GameState = Persisted & Session & Actions;

export const INITIAL: Persisted & Session = {
  origin: null,
  inventory: [],
  opened: [],
  introSeen: false,
  contactSeen: false,
  druid: 'offstage',
  node: null,
  round: null,
  lossStreak: 0,
  usedChecks: [],
  justReceived: [],
  satchelOpen: false,
  viewing: null,
  viewingFirstTime: false,
  contactOpen: false,
  bark: null,
  barkIndex: 0,
  celebrate: 0,
  rng: Math.random,
};

export function remainingItems(inventory: readonly ItemId[]): ItemId[] {
  return ALL_ITEMS.filter((i) => !inventory.includes(i));
}

export function selectDruidHold(s: Pick<GameState, 'node' | 'druid'>): boolean {
  return s.node !== null || s.druid === 'entering' || s.druid === 'greeting' || s.druid === 'waiting';
}

/** localStorage can throw (private mode, blocked site data); the game must still run. */
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

export const useGame = create<GameState>()(
  persist(
    (set, get) => {
      const grant = (ids: ItemId[]) => {
        const { inventory, justReceived } = get();
        const fresh = ids.filter((i) => !inventory.includes(i));
        set({ inventory: [...inventory, ...fresh], justReceived: [...justReceived, ...fresh] });
      };

      return {
        ...INITIAL,

        setDruid: (druid) => set({ druid }),
        startDruidEntrance: () => {
          if (get().druid === 'offstage') set({ druid: 'entering' });
        },
        druidArrived: () => {
          if (get().druid === 'entering') set({ druid: 'greeting' });
        },
        greetingDone: () => {
          if (get().druid === 'greeting') set({ druid: 'waiting', introSeen: true });
        },

        talk: () => {
          const s = get();
          if (s.node || s.druid === 'offstage' || s.druid === 'entering') return;
          const druid = s.druid === 'greeting' ? 'waiting' : s.druid;
          if (remainingItems(s.inventory).length === 0) {
            set({ bark: copy.barks[s.barkIndex % copy.barks.length], barkIndex: s.barkIndex + 1, druid: 'patrolling', introSeen: true });
            return;
          }
          set({ druid, introSeen: true, node: s.origin ? { id: 'wager', afterOrigin: null } : { id: 'origin' } });
        },
        clearBark: () => set({ bark: null }),

        chooseOrigin: (origin) => set({ origin, node: { id: 'wager', afterOrigin: origin } }),
        chooseWager: (wager) => set({ node: { id: 'check', wager } }),
        askAbout: () => set({ node: { id: 'about' } }),
        backToWager: () => set({ node: { id: 'wager', afterOrigin: null } }),

        chooseCheck: (check) => {
          const s = get();
          const node = s.node;
          if (node?.id !== 'check') return;
          const def = CHECKS[check];
          const roll = rollD20(s.rng);
          const modifier = modifierFor(s.origin, def.ability);
          const { success } = resolveCheck(roll, modifier, def.dc);
          set({
            usedChecks: [...s.usedChecks, check],
            node: { id: 'rolling', wager: node.wager, check, roll, modifier, dc: def.dc, success },
          });
        },

        justRoll: () => {
          const s = get();
          const node = s.node;
          if (node?.id !== 'check') return;
          set({ round: startRound(NO_MODS, s.lossStreak, s.rng), node: { id: 'dice', wager: node.wager } });
        },

        continueAfterRoll: () => {
          const s = get();
          const node = s.node;
          if (node?.id !== 'rolling') return;
          if (node.roll === 20) {
            const ids = remainingItems(s.inventory);
            grant(ids);
            set({ node: { id: 'nat20', items: ids }, round: null, celebrate: s.celebrate + 1 });
            return;
          }
          const mods = applyCheck(NO_MODS, node.check, node.success);
          set({ round: startRound(mods, s.lossStreak, s.rng), node: { id: 'dice', wager: node.wager } });
        },

        toggleHold: (i) => {
          const r = get().round;
          if (r) set({ round: toggleHeld(r, i) });
        },
        reroll: () => {
          const s = get();
          if (s.round) set({ round: rerollPlayer(s.round, s.rng) });
        },

        revealRound: () => {
          const s = get();
          const node = s.node;
          if (node?.id !== 'dice' || !s.round) return;
          const result = finishRound(s.round);
          if (result.outcome === 'win') {
            grant([node.wager]);
            set({ lossStreak: 0, round: null, node: { id: 'roundWon', wager: node.wager, result } });
          } else {
            set({ lossStreak: s.lossStreak + 1, round: null, node: { id: 'roundLost', wager: node.wager, result } });
          }
        },

        continueDialogue: () => {
          const s = get();
          const node = s.node;
          if (!node) return;
          if (node.id === 'roundWon' || node.id === 'nat20') {
            set({ node: remainingItems(s.inventory).length === 0 ? { id: 'epilogue' } : { id: 'wager', afterOrigin: null } });
          } else if (node.id === 'roundLost') {
            set({ node: { id: 'check', wager: node.wager } });
          } else if (node.id === 'epilogue') {
            get().closeDialogue();
          }
        },

        closeDialogue: () => set({ node: null, round: null, druid: 'patrolling' }),

        ackReceived: () => set({ justReceived: get().justReceived.slice(1) }),
        setSatchelOpen: (satchelOpen) => set({ satchelOpen }),
        viewItem: (id) => {
          if (!id) {
            set({ viewing: null });
            return;
          }
          const { opened } = get();
          set({ viewing: id, viewingFirstTime: !opened.includes(id), opened: opened.includes(id) ? opened : [...opened, id] });
        },
        setContactOpen: (contactOpen) => set(contactOpen ? { contactOpen, contactSeen: true } : { contactOpen }),

        skipTale: () => {
          grant(remainingItems(get().inventory));
          set({ node: null, round: null, introSeen: true, druid: get().druid === 'offstage' ? 'offstage' : 'patrolling' });
          get().viewItem('cv');
        },
        resetTale: () => set({ ...INITIAL, rng: get().rng }),
      };
    },
    {
      name: 'ink-antler-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ origin: s.origin, inventory: s.inventory, opened: s.opened, introSeen: s.introSeen, contactSeen: s.contactSeen }),
    },
  ),
);
```

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: PASS. If `persists only the durable fields` fails because zustand wrote `version: 0` next to `state`, that's fine. The test reads only `.state`.

- [ ] **Step 6: Commit**

```bash
git add src/game src/content
git commit -m "feat: game store, dialogue flow and all copy"
```

---

### Task 6: Pixel-art maps (DOM SVG and Pixi textures)

Small sprites (satchel, item icons, `!` marker, cursor, wax seal, torch, flames, cloud, signpost, sign board, iron bar, chain) are stored as character maps. They're rendered two ways: as inline SVG in the React UI and as nearest-filtered textures in the Pixi scene.

**Files:**
- Create: `src/pixel/pixelMap.ts`, `src/pixel/palette.ts`, `src/pixel/sprites.ts`, `src/pixel/PixelArt.tsx`
- Create: `src/scene/pixelTexture.ts`
- Test: `src/pixel/pixelMap.test.ts`, `src/pixel/sprites.test.ts`

**Interfaces:**
- Produces:
  - `pixelMap.ts`: `type Palette = Record<string, string>`; `interface PixelRun { x; y; w; color }`; `mapToRuns(rows, palette): PixelRun[]` (throws `Unknown palette key "z" at x,y`); `mapSize(rows): { w; h }`.
  - `sprites.ts`: maps `SATCHEL SCROLL LETTER SEAL MARKER CURSOR TORCH FLAMES CLOUD SIGNPOST`; generators `signBoardRows(w, h)`, `barRows(w)`, `chainRows(links)`; palettes `WOOD IRON IRON_WOOD FLAME LEATHER ITEM SEAL_PALETTE GOLD CURSOR_PALETTE CLOUD_PALETTE`; `ICONS: Record<ItemId, string[]>`; `SPRITE_REGISTRY`.
  - `PixelArt.tsx`: `<PixelArt rows palette scale? className? style? title? />` renders an inline SVG.
  - `pixelTexture.ts`: `pixelTexture(renderer: Renderer, rows, palette): Texture` (Pixi, nearest).

- [ ] **Step 1: Write the failing pixelMap tests**

`src/pixel/pixelMap.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { mapSize, mapToRuns } from './pixelMap';

describe('mapToRuns', () => {
  it('merges horizontal runs and skips transparent cells', () => {
    expect(mapToRuns(['aab.', '.bbb'], { a: '#a', b: '#b' })).toEqual([
      { x: 0, y: 0, w: 2, color: '#a' },
      { x: 2, y: 0, w: 1, color: '#b' },
      { x: 1, y: 1, w: 3, color: '#b' },
    ]);
  });

  it('throws on unknown keys', () => {
    expect(() => mapToRuns(['.z'], {})).toThrow('Unknown palette key "z" at 1,0');
  });
});

describe('mapSize', () => {
  it('uses the widest row', () => {
    expect(mapSize(['abc', 'ab'])).toEqual({ w: 3, h: 2 });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/pixel/pixelMap.test.ts`
Expected: FAIL, "Failed to resolve import './pixelMap'".

- [ ] **Step 3: Implement pixelMap and the palette**

`src/pixel/pixelMap.ts`:
```ts
export type Palette = Record<string, string>;

export interface PixelRun {
  x: number;
  y: number;
  w: number;
  color: string;
}

/** Converts rows of palette keys into horizontal same-colour runs. '.' and ' ' are transparent. */
export function mapToRuns(rows: readonly string[], palette: Palette): PixelRun[] {
  const runs: PixelRun[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (ch !== '.' && ch !== ' ') {
        const color = palette[ch];
        if (!color) throw new Error(`Unknown palette key "${ch}" at ${x},${y}`);
        runs.push({ x, y, w: end - x, color });
      }
      x = end;
    }
  });
  return runs;
}

export function mapSize(rows: readonly string[]): { w: number; h: number } {
  return { w: Math.max(...rows.map((r) => r.length)), h: rows.length };
}
```

`src/pixel/palette.ts`:
```ts
export const P = {
  outline: '#1b1210',
  woodDark: '#4a2c1a',
  wood: '#7a4a2a',
  woodLight: '#a8703f',
  gold: '#e8b04a',
  goldDark: '#a8741e',
  iron: '#3a3a44',
  ironLight: '#6b6b78',
  parchment: '#f1dfb4',
  parchmentDark: '#caa66a',
  leather: '#8a5230',
  leatherDark: '#5a321c',
  leatherLight: '#b06a3c',
  red: '#a8322a',
  redDark: '#6e1c18',
  flame1: '#fff3a0',
  flame2: '#ffb52e',
  flame3: '#e0561b',
} as const;
```

- [ ] **Step 4: Run the pixelMap tests**

Run: `npx vitest run src/pixel/pixelMap.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing sprite tests**

`src/pixel/sprites.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { mapToRuns } from './pixelMap';
import { SPRITE_REGISTRY, barRows, chainRows, signBoardRows } from './sprites';

describe('sprite maps', () => {
  it.each(SPRITE_REGISTRY)('$name is rectangular and uses only palette keys', ({ rows, palette }) => {
    expect(new Set(rows.map((r) => r.length)).size).toBe(1);
    expect(() => mapToRuns(rows, palette)).not.toThrow();
  });

  it('generators produce the requested sizes', () => {
    const board = signBoardRows(120, 36);
    expect(board).toHaveLength(36);
    expect(board[0]).toHaveLength(120);
    expect(board[0][0]).toBe('.');
    expect(barRows(150)).toHaveLength(4);
    expect(chainRows(4)).toHaveLength(16);
  });
});
```

- [ ] **Step 6: Run to verify failure**

Run: `npx vitest run src/pixel/sprites.test.ts`
Expected: FAIL, "Failed to resolve import './sprites'".

- [ ] **Step 7: Implement the sprites**

`src/pixel/sprites.ts`:
```ts
import type { ItemId } from '../game/items';
import { P } from './palette';
import type { Palette } from './pixelMap';

export const WOOD: Palette = { o: P.outline, D: P.woodDark, W: P.wood, L: P.woodLight, G: P.goldDark };
export const IRON: Palette = { o: P.outline, I: P.ironLight, i: P.iron };
export const IRON_WOOD: Palette = { o: P.outline, I: P.ironLight, W: P.wood };
export const FLAME: Palette = { a: P.flame1, b: P.flame2, c: P.flame3 };
export const LEATHER: Palette = { o: P.outline, D: P.leatherDark, L: P.leather, l: P.leatherLight, G: P.gold };
export const ITEM: Palette = { o: P.outline, W: P.woodDark, P: P.parchment, p: P.parchmentDark, R: P.red, r: P.redDark };
export const SEAL_PALETTE: Palette = { o: P.redDark, R: P.red, r: P.redDark, G: P.gold };
export const GOLD: Palette = { o: P.outline, G: P.gold, g: P.goldDark };
export const CURSOR_PALETTE: Palette = { o: P.outline, P: P.parchment };
export const CLOUD_PALETTE: Palette = { o: '#9fb8d8', W: '#ffffff', B: '#dce8f5' };

export const SATCHEL = [
  '.....oooooo.....',
  '....oDDDDDDo....',
  '...oD......Do...',
  '...oD......Do...',
  '.oooooooooooooo.',
  'oLLLLLLLLLLLLLLo',
  'olllllllllllllLo',
  'oDDDDDDoGoDDDDDo',
  'oLLLLLLoGoLLLLLo',
  'oLLLLLLoooLLLLLo',
  'oLLLLLLLLLLLLLLo',
  'oLLLLLLLLLLLLLLo',
  'oDLLLLLLLLLLLLDo',
  'oDDLLLLLLLLLLDDo',
  '.oDDDDDDDDDDDDo.',
  '..oooooooooooo..',
];

export const SCROLL = [
  '..oooooooooooo..',
  '.oWPPPPPPPPPPWo.',
  '.oWPPPPPPPPPPWo.',
  '.oWppppRRppppWo.',
  '.oWPPPPRRPPPPWo.',
  '.oWPPPPRRPPPPWo.',
  '.oWppppRRppppWo.',
  '.oWPPPPPPPPPPWo.',
  '.oWPPPPPPPPPPWo.',
  '..oooooooooooo..',
  '......oRRo......',
  '.....oRo.oRo....',
];

export const LETTER = [
  'oooooooooooooooo',
  'oPoPPPPPPPPPPoPo',
  'oPPoPPPPPPPPoPPo',
  'oPPPoPPPPPPoPPPo',
  'oPPPPoPPPPoPPPPo',
  'oPPPPPoRRoPPPPPo',
  'oPPPPPRRRRPPPPPo',
  'oPPPPPRrrRPPPPPo',
  'oPPPPPPRRPPPPPPo',
  'oPPPPPPPPPPPPPPo',
  'oppppppppppppppo',
  'oooooooooooooooo',
];

export const SEAL = [
  '..oooooo..',
  '.oRRRRRRo.',
  'oRRrrrrRRo',
  'oRrRRRRrRo',
  'oRrRGGRrRo',
  'oRrRRRRrRo',
  'oRRrrrrRRo',
  '.oRRRRRRo.',
  '..oooooo..',
];

export const MARKER = [
  '.ooo.',
  'oGGGo',
  'oGGGo',
  'oGGGo',
  'oGGGo',
  'oGgGo',
  '.oGo.',
  '..o..',
  '.....',
  '.ooo.',
  'oGGGo',
  '.ooo.',
];

export const CURSOR = [
  'o......',
  'oo.....',
  'oPo....',
  'oPPo...',
  'oPPPo..',
  'oPPPPo.',
  'oPPPPPo',
  'oPPoooo',
  'oPo....',
  'oo.....',
];

export const TORCH = [
  '.oooooo.',
  'oIIIIIIo',
  '.oIIIIo.',
  '..oWWo..',
  '..oWWo..',
  '..oWWo..',
  '..oWWo..',
  '..oWWo..',
  '..oWWo..',
  '...oo...',
];

export const FLAMES = [
  ['....c...', '...cbc..', '..cbbc..', '..cbabc.', '.cbaabc.', '.cbaabc.', '..cbbc..'],
  ['...c....', '...cc...', '..cbbc..', '.cbabc..', '.cbaabc.', '.cbaabc.', '..cbbc..'],
  ['.....c..', '....cc..', '...cbbc.', '..cbabc.', '.cbaabc.', '.cbaabc.', '..cbbc..'],
];

export const CLOUD = [
  '........oooo............',
  '......ooWWWWoo..oooo....',
  '....ooWWWWWWWWooWWWWoo..',
  '..ooWWWWWWWWWWWWWWWWWWo.',
  '.oWWWWWWWWWWWWWWWWWWWWWo',
  'oBBWWWWWWWWWWWWWWWWWWWBo',
  '.oBBBBBBBBBBBBBBBBBBBBo.',
  '..oooooooooooooooooooo..',
];

const POST = '......oWWo......';
export const SIGNPOST = [
  '.......oo.......',
  POST,
  'oooooooWWooooo..',
  'oLLLLLLLLLLLLLo.',
  'oWWWWWWWWWWWWWWo',
  'oWWWWWWWWWWWWWo.',
  'oooooooWWooooo..',
  POST,
  '..oooooWWooooooo',
  '.oLLLLLLLLLLLLLo',
  'oWWWWWWWWWWWWWWo',
  '.oWWWWWWWWWWWWWo',
  '..oooooWWooooooo',
  POST, POST, POST, POST, POST, POST, POST, POST, POST,
  '.....oDDDDo.....',
  '....oooooooo....',
];

/** Carved oak board: outline, dark frame, gold inlay, planks with grain. Uses the WOOD palette. */
export function signBoardRows(w: number, h: number): string[] {
  const rows: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const corner = (x === 0 || x === w - 1) && (y === 0 || y === h - 1);
      const d = Math.min(x, y, w - 1 - x, h - 1 - y);
      if (corner) row += '.';
      else if (d === 0) row += 'o';
      else if (d <= 2) row += 'D';
      else if (d === 3) row += 'G';
      else if (d === 4) row += 'D';
      else if ((y - 5) % 9 === 8) row += 'D';
      else if ((x * 7 + y * 13) % 23 === 0 || (x * 3 + y * 5) % 31 === 0) row += 'L';
      else row += 'W';
    }
    rows.push(row);
  }
  return rows;
}

/** Wrought-iron beam the sign hangs from. Uses the IRON palette. */
export function barRows(w: number): string[] {
  return ['o'.repeat(w), `o${'I'.repeat(w - 2)}o`, `o${'i'.repeat(w - 2)}o`, 'o'.repeat(w)];
}

const CHAIN_LINK = ['.oo.', 'o..o', 'o..o', '.oo.'];
export function chainRows(links: number): string[] {
  return Array.from({ length: links }, () => CHAIN_LINK).flat();
}

export const ICONS: Record<ItemId, string[]> = { cv: SCROLL, letter: LETTER };

export const SPRITE_REGISTRY: { name: string; rows: string[]; palette: Palette }[] = [
  { name: 'satchel', rows: SATCHEL, palette: LEATHER },
  { name: 'scroll', rows: SCROLL, palette: ITEM },
  { name: 'letter', rows: LETTER, palette: ITEM },
  { name: 'seal', rows: SEAL, palette: SEAL_PALETTE },
  { name: 'marker', rows: MARKER, palette: GOLD },
  { name: 'cursor', rows: CURSOR, palette: CURSOR_PALETTE },
  { name: 'torch', rows: TORCH, palette: IRON_WOOD },
  ...FLAMES.map((rows, i) => ({ name: `flame${i}`, rows, palette: FLAME })),
  { name: 'cloud', rows: CLOUD, palette: CLOUD_PALETTE },
  { name: 'signpost', rows: SIGNPOST, palette: WOOD },
  { name: 'board', rows: signBoardRows(120, 36), palette: WOOD },
  { name: 'bar', rows: barRows(150), palette: IRON },
  { name: 'chain', rows: chainRows(4), palette: IRON },
];
```

- [ ] **Step 8: Write the two renderers**

`src/pixel/PixelArt.tsx`:
```tsx
import { useMemo, type CSSProperties } from 'react';
import { mapSize, mapToRuns, type Palette } from './pixelMap';

interface Props {
  rows: readonly string[];
  palette: Palette;
  scale?: number;
  className?: string;
  style?: CSSProperties;
  /** Accessible name; omit for decorative art. */
  title?: string;
}

export function PixelArt({ rows, palette, scale = 4, className, style, title }: Props) {
  const runs = useMemo(() => mapToRuns(rows, palette), [rows, palette]);
  const { w, h } = mapSize(rows);
  return (
    <svg
      className={className}
      style={style}
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {runs.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.color} />
      ))}
    </svg>
  );
}
```

`src/scene/pixelTexture.ts`:
```ts
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
```

- [ ] **Step 9: Run tests and type-check**

Run: `npm test && npx tsc`
Expected: all PASS, and tsc reports no errors. If tsc rejects the `generateTexture` options object, check the installed signature in `node_modules/pixi.js/lib/rendering/renderers/shared/extract/GenerateTexture*.d.ts` and match its option names.

- [ ] **Step 10: Commit**

```bash
git add src/pixel src/scene
git commit -m "feat: pixel-art maps with SVG and Pixi texture renderers"
```

---

### Task 7: Scene core, walking druid and speech cues

Pixi draws the background and the druid. React draws the druid's click target and speech bubbles inside a DOM **anchor** that the scene moves every tick. Later tasks attach extra scene modules to the returned `SceneHandle`.

**Files:**
- Create: `src/world/layout.ts`, `src/world/stageTransform.ts`, `src/npc/patrol.ts`, `src/engine/motion.ts`
- Create: `src/scene/createScene.ts`, `src/scene/SceneCanvas.tsx`, `src/scene/scene.css`
- Create: `src/ui/typewriter.ts`, `src/ui/useTypewriter.ts`, `src/ui/SpeechBubble.tsx`, `src/ui/QuestMarker.tsx`, `src/ui/Hint.tsx`, `src/ui/cues.css`
- Create: `src/npc/speech.tsx`, `src/npc/DruidOverlay.tsx`, `src/npc/npc.css`
- Modify: `src/App.tsx` (full replacement)
- Test: `src/world/stageTransform.test.ts`, `src/npc/patrol.test.ts`, `src/ui/typewriter.test.ts`

**Interfaces:**
- Consumes: `useGame`, `selectDruidHold`, `DruidScene` (Task 5); `copy`, `SIGN_NAME`, `SIGN_SUBTITLE`; `druidSheet` constants (Task 2); `PixelArt`, `MARKER`, `GOLD`, `CURSOR`, `CURSOR_PALETTE` (Task 6).
- Produces:
  - `layout.ts`: `WORLD_W, WORLD_H, MAX_CROP_X, MAX_CROP_Y, STREET_Y, CENTER_X, PATROL_MIN_X, PATROL_MAX_X, ENTER_START_X, SIGN, SIGNPOST, FORGE, CHIMNEYS`.
  - `stageTransform.ts`: `interface StageTransform { scale; offsetX; offsetY }`, `computeStageTransform(vw, vh)`, `anchorTransform(t, x, y): string`.
  - `patrol.ts`: `NpcState`, `NpcMode`, `ENTER_SPEED`, `WALK_SPEED`, `MIN_STEP`, `createEnteringNpc()`, `createStandingNpc()`, `setHold(s, hold)`, `pickTarget(x, rng)`, `stepNpc(s, dtMs, rng, { patrol })`, `frameFor(s)`.
  - `motion.ts`: `prefersReducedMotion(): boolean` (true when `matchMedia` is missing, e.g. jsdom).
  - `createScene.ts`: `createScene(host, anchors: { druid: HTMLElement }, cb: { onDruidArrive(): void }): Promise<SceneHandle>`. `SceneHandle` has `app: Application`, `world: Container`, `layers: { back: Container; actors: Container; front: Container }`, `onTick(fn: (dtMs: number) => void): () => void`, `pinAnchor(el, x, y): () => void`, `druidPosition(): { x: number; y: number } | null`, `setDruid(scene, hold)`, `destroy()`.
  - `SceneCanvas.tsx`: `<SceneCanvas onReady={(h: SceneHandle) => void} druidOverlay={ReactNode} />`.
  - `typewriter.ts`: `CHARS_PER_SECOND`, `typedSlice(text, elapsedMs, cps?)`. `useTypewriter(text)` returns `{ shown, done, finish }`.
  - `<SpeechBubble text onTyped? />` (remount with `key` for each new line), `<QuestMarker />`, `<Hint text />`.
  - `speech.tsx`: `<Greeting onDone />`, `<WaitingCue />`, `<Bark text onDone />`. `<DruidOverlay />` reads the store.

- [ ] **Step 1: Write the failing tests**

`src/world/stageTransform.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { anchorTransform, computeStageTransform } from './stageTransform';

describe('computeStageTransform', () => {
  it('fits a 16:9 viewport exactly', () => {
    expect(computeStageTransform(1920, 1080)).toEqual({ scale: 1, offsetX: 0, offsetY: 0 });
  });

  it('crops at most 20% horizontally on 4:3, then letterboxes', () => {
    const t = computeStageTransform(1440, 1080);
    expect(t.scale).toBeCloseTo(0.9375);
    expect(t.offsetX).toBeCloseTo(-180);
    expect(t.offsetY).toBeCloseTo(33.75);
  });

  it('crops at most 15% vertically on 21:9, then pillarboxes', () => {
    const t = computeStageTransform(2560, 1080);
    expect(t.scale).toBeCloseTo(1.17647, 4);
    expect(t.offsetX).toBeCloseTo(150.59, 1);
    expect(t.offsetY).toBeCloseTo(-95.29, 1);
  });
});

describe('anchorTransform', () => {
  it('maps a world point to a screen translate + scale', () => {
    expect(anchorTransform({ scale: 0.5, offsetX: 10, offsetY: 20 }, 100, 200)).toBe('translate(60px, 120px) scale(0.5)');
  });
});
```

`src/npc/patrol.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { CENTER_X, ENTER_START_X, PATROL_MIN_X } from '../world/layout';
import {
  ENTER_SPEED, MIN_STEP, createEnteringNpc, createStandingNpc, frameFor, pickTarget, setHold, stepNpc,
} from './patrol';

const still = () => 0.5;

describe('stepNpc', () => {
  it('walks in from the left and holds on arrival', () => {
    let s = stepNpc(createEnteringNpc(), 1000, still, { patrol: false });
    expect(s).toMatchObject({ mode: 'enter', dir: 1 });
    expect(s.x).toBeCloseTo(ENTER_START_X + ENTER_SPEED);
    for (let i = 0; i < 20; i++) s = stepNpc(s, 1000, still, { patrol: false });
    expect(s).toMatchObject({ x: CENTER_X, mode: 'hold' });
  });

  it('idles, then walks to a new target while patrolling', () => {
    let s = stepNpc(createStandingNpc(), 1000, still, { patrol: true });
    expect(s.mode).toBe('idle');
    s = stepNpc(s, 1500, () => 0, { patrol: true });
    expect(s).toMatchObject({ mode: 'walk', targetX: PATROL_MIN_X });
    s = stepNpc(s, 100, still, { patrol: true });
    expect(s.dir).toBe(-1);
  });

  it('stays put when patrol is off', () => {
    const s = stepNpc(createStandingNpc(), 10000, still, { patrol: false });
    expect(s).toMatchObject({ mode: 'idle', x: CENTER_X });
  });
});

describe('helpers', () => {
  it('pickTarget never picks a spot closer than MIN_STEP', () => {
    expect(Math.abs(pickTarget(CENTER_X, still) - CENTER_X)).toBeGreaterThanOrEqual(MIN_STEP);
  });

  it('setHold freezes walkers and releases to idle, but never interrupts the entrance', () => {
    const walking = { ...createStandingNpc(), mode: 'walk' as const };
    expect(setHold(walking, true).mode).toBe('hold');
    expect(setHold({ ...walking, mode: 'hold' }, false)).toMatchObject({ mode: 'idle', idleLeftMs: 1500 });
    expect(setHold(createEnteringNpc(), true).mode).toBe('enter');
  });

  it('frameFor uses walk frames while moving and idle frames otherwise', () => {
    expect(frameFor({ ...createEnteringNpc(), animMs: 0 })).toBe(2);
    expect(frameFor({ ...createEnteringNpc(), animMs: 125 })).toBe(3);
    expect(frameFor({ ...createStandingNpc(), animMs: 500 })).toBe(1);
  });
});
```

`src/ui/typewriter.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { typedSlice } from './typewriter';

describe('typedSlice', () => {
  it('reveals characters over time', () => {
    const text = 'Hail, traveller. You have the look of someone searching.';
    expect(typedSlice(text, 0)).toBe('');
    expect(typedSlice(text, 500, 40)).toBe(text.slice(0, 20));
    expect(typedSlice(text, Infinity)).toBe(text);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL. The three new files can't resolve their imports.

- [ ] **Step 3: Implement layout, stage transform, patrol, typewriter, motion**

`src/world/layout.ts`:
```ts
/** World coordinates match sprites/bg/bg.png. Tune positions against the running scene. */
export const WORLD_W = 1920;
export const WORLD_H = 1080;

/** The stage may crop at most this share of the world before it letterboxes instead. */
export const MAX_CROP_X = 0.2;
export const MAX_CROP_Y = 0.15;

/** Feet baseline of the upper street. */
export const STREET_Y = 628;
export const CENTER_X = 960;
export const PATROL_MIN_X = 420;
export const PATROL_MAX_X = 1500;
export const ENTER_START_X = -120;

/** Title sign: horizontal centre and the y of its iron beam. */
export const SIGN = { x: 960, top: 96 };
/** Contact signpost by the stairs: horizontal centre and feet. */
export const SIGNPOST = { x: 1210, feetY: 985 };
export const FORGE = { x: 140, y: 520 };
export const CHIMNEYS = [
  { x: 152, y: 292 },
  { x: 520, y: 300 },
];
```

`src/world/stageTransform.ts`:
```ts
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
```

`src/npc/patrol.ts`:
```ts
import type { Rng } from '../game/dice';
import { CENTER_X, ENTER_START_X, PATROL_MAX_X, PATROL_MIN_X } from '../world/layout';
import { IDLE_FRAMES, WALK_FRAMES } from './druidSheet';

export type NpcMode = 'enter' | 'walk' | 'idle' | 'hold';

export interface NpcState {
  x: number;
  dir: 1 | -1;
  mode: NpcMode;
  targetX: number;
  idleLeftMs: number;
  animMs: number;
}

/** World px per second. The entrance is brisk so nobody waits for him. */
export const ENTER_SPEED = 220;
export const WALK_SPEED = 90;
export const MIN_STEP = 160;
const WALK_FRAME_MS = 125;
const IDLE_FRAME_MS = 500;

export function createEnteringNpc(): NpcState {
  return { x: ENTER_START_X, dir: 1, mode: 'enter', targetX: CENTER_X, idleLeftMs: 0, animMs: 0 };
}

export function createStandingNpc(): NpcState {
  return { x: CENTER_X, dir: 1, mode: 'idle', targetX: CENTER_X, idleLeftMs: 2000, animMs: 0 };
}

export function setHold(s: NpcState, hold: boolean): NpcState {
  if (hold && (s.mode === 'walk' || s.mode === 'idle')) return { ...s, mode: 'hold' };
  if (!hold && s.mode === 'hold') return { ...s, mode: 'idle', idleLeftMs: 1500 };
  return s;
}

export function pickTarget(x: number, rng: Rng): number {
  const t = PATROL_MIN_X + rng() * (PATROL_MAX_X - PATROL_MIN_X);
  if (Math.abs(t - x) >= MIN_STEP) return t;
  return x < (PATROL_MIN_X + PATROL_MAX_X) / 2
    ? Math.min(PATROL_MAX_X, x + MIN_STEP * 2)
    : Math.max(PATROL_MIN_X, x - MIN_STEP * 2);
}

export function stepNpc(s: NpcState, dtMs: number, rng: Rng, opts: { patrol: boolean }): NpcState {
  const animMs = s.animMs + dtMs;
  if (s.mode === 'enter' || s.mode === 'walk') {
    const delta = s.targetX - s.x;
    const stepPx = ((s.mode === 'enter' ? ENTER_SPEED : WALK_SPEED) * dtMs) / 1000;
    const dir: 1 | -1 = delta >= 0 ? 1 : -1;
    if (Math.abs(delta) <= stepPx) {
      return s.mode === 'enter'
        ? { ...s, x: s.targetX, dir, mode: 'hold', animMs }
        : { ...s, x: s.targetX, dir, mode: 'idle', idleLeftMs: 2000 + rng() * 3000, animMs };
    }
    return { ...s, x: s.x + dir * stepPx, dir, animMs };
  }
  if (s.mode === 'idle' && opts.patrol) {
    const idleLeftMs = s.idleLeftMs - dtMs;
    if (idleLeftMs <= 0) return { ...s, mode: 'walk', targetX: pickTarget(s.x, rng), idleLeftMs: 0, animMs };
    return { ...s, idleLeftMs, animMs };
  }
  return { ...s, animMs };
}

export function frameFor(s: NpcState): number {
  if (s.mode === 'enter' || s.mode === 'walk') return WALK_FRAMES[Math.floor(s.animMs / WALK_FRAME_MS) % WALK_FRAMES.length];
  return IDLE_FRAMES[Math.floor(s.animMs / IDLE_FRAME_MS) % IDLE_FRAMES.length];
}
```

`src/ui/typewriter.ts`:
```ts
export const CHARS_PER_SECOND = 40;

export function typedSlice(text: string, elapsedMs: number, cps = CHARS_PER_SECOND): string {
  if (elapsedMs <= 0) return '';
  return text.slice(0, Math.floor((elapsedMs * cps) / 1000));
}
```

`src/engine/motion.ts`:
```ts
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Write the scene core**

`src/scene/createScene.ts`:
```ts
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
```

`src/scene/SceneCanvas.tsx`:
```tsx
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { selectDruidHold, useGame } from '../game/store';
import { DRUID_H, DRUID_W } from '../npc/druidSheet';
import { createScene, type SceneHandle } from './createScene';
import './scene.css';

interface Props {
  onReady: (handle: SceneHandle) => void;
  druidOverlay: ReactNode;
}

export function SceneCanvas({ onReady, druidOverlay }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const druidRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const [handle, setHandle] = useState<SceneHandle | null>(null);
  const druid = useGame((s) => s.druid);
  const hold = useGame(selectDruidHold);

  useEffect(() => {
    let cancelled = false;
    let created: SceneHandle | null = null;
    createScene(hostRef.current!, { druid: druidRef.current! }, { onDruidArrive: () => useGame.getState().druidArrived() }).then((h) => {
      if (cancelled) {
        h.destroy();
        return;
      }
      created = h;
      setHandle(h);
      onReadyRef.current(h);
    });
    return () => {
      cancelled = true;
      created?.destroy();
    };
  }, []);

  useEffect(() => {
    handle?.setDruid(druid, hold);
  }, [handle, druid, hold]);

  return (
    <>
      <div ref={hostRef} className="scene-host" aria-hidden="true" />
      <div ref={druidRef} className="anchor" style={{ width: DRUID_W, height: DRUID_H, display: druid === 'offstage' ? 'none' : undefined }}>
        {druidOverlay}
      </div>
    </>
  );
}
```

`src/scene/scene.css`:
```css
.scene-host { position: fixed; inset: 0; z-index: 0; }
.scene-host canvas { display: block; }
/* World-sized DOM box positioned by the scene; children use world px. */
.anchor { position: fixed; left: 0; top: 0; z-index: 5; transform-origin: 0 0; }
```

- [ ] **Step 6: Write the speech cues and the druid overlay**

`src/ui/useTypewriter.ts`:
```ts
import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../engine/motion';
import { typedSlice } from './typewriter';

/** Types `text` out once per mount. Remount (change `key`) to type a new line. */
export function useTypewriter(text: string) {
  const [instant] = useState(prefersReducedMotion);
  const [elapsed, setElapsed] = useState(instant ? Infinity : 0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (instant) return;
    const start = performance.now();
    timer.current = window.setInterval(() => {
      const e = performance.now() - start;
      setElapsed(e);
      if (typedSlice(text, e).length >= text.length) window.clearInterval(timer.current);
    }, 30);
    return () => window.clearInterval(timer.current);
  }, [text, instant]);

  const shown = typedSlice(text, elapsed);
  return {
    shown,
    done: shown.length >= text.length,
    finish: () => {
      window.clearInterval(timer.current);
      setElapsed(Infinity);
    },
  };
}
```

`src/ui/SpeechBubble.tsx`:
```tsx
import { useEffect, useRef } from 'react';
import { useTypewriter } from './useTypewriter';
import './cues.css';

/** Give each new line a new `key` so the typewriter restarts. */
export function SpeechBubble({ text, onTyped }: { text: string; onTyped?: () => void }) {
  const { shown, done, finish } = useTypewriter(text);
  const fired = useRef(false);

  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true;
      onTyped?.();
    }
  }, [done, onTyped]);

  return (
    <div className="bubble" role="status" onClick={finish}>
      {done ? text : (
        <>
          <span aria-hidden="true">{shown}</span>
          <span className="sr-only">{text}</span>
        </>
      )}
    </div>
  );
}
```

`src/ui/QuestMarker.tsx`:
```tsx
import { PixelArt } from '../pixel/PixelArt';
import { GOLD, MARKER } from '../pixel/sprites';
import './cues.css';

export function QuestMarker() {
  return <PixelArt rows={MARKER} palette={GOLD} scale={5} className="marker" />;
}
```

`src/ui/Hint.tsx`:
```tsx
import { PixelArt } from '../pixel/PixelArt';
import { CURSOR, CURSOR_PALETTE } from '../pixel/sprites';
import './cues.css';

export function Hint({ text }: { text: string }) {
  return (
    <div className="hint px-parchment" role="note">
      <PixelArt rows={CURSOR} palette={CURSOR_PALETTE} scale={3} />
      {text}
    </div>
  );
}
```

`src/ui/cues.css`:
```css
.bubble {
  position: relative;
  width: max-content;
  max-width: 440px;
  padding: 12px 16px;
  background: #fff8e6;
  color: var(--ink);
  border: 4px solid var(--outline);
  box-shadow: 0 4px 0 rgb(0 0 0 / 0.3);
  font-size: 26px;
  line-height: 1.25;
  white-space: pre-line;
  cursor: pointer;
}
/* Stepped pixel tail. */
.bubble::after {
  content: '';
  position: absolute;
  left: calc(50% - 8px);
  top: 100%;
  width: 16px;
  height: 8px;
  background: #fff8e6;
  border-left: 4px solid var(--outline);
  border-right: 4px solid var(--outline);
  box-shadow: 4px 8px 0 -4px var(--outline);
}
.marker { animation: bob 1s steps(2) infinite; }
@keyframes bob { 50% { transform: translateY(-8px); } }
.hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 20px;
  white-space: nowrap;
}
```

`src/npc/speech.tsx`:
```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { copy } from '../content/copy';
import { QuestMarker } from '../ui/QuestMarker';
import { SpeechBubble } from '../ui/SpeechBubble';

export const LINE_PAUSE_MS = 1400;
export const NUDGE_MS = 6000;
export const BARK_MS = 4000;

export function Greeting({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const lines = copy.greeting;
  const handleTyped = useCallback(() => {
    timer.current = window.setTimeout(() => (i + 1 < lines.length ? setI(i + 1) : onDone()), LINE_PAUSE_MS);
  }, [i, lines.length, onDone]);
  return <SpeechBubble key={i} text={lines[i]} onTyped={handleTyped} />;
}

export function WaitingCue() {
  const [nudge, setNudge] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setNudge(true), NUDGE_MS);
    return () => window.clearTimeout(t);
  }, []);
  return nudge ? <SpeechBubble text={copy.nudge} /> : <QuestMarker />;
}

export function Bark({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, BARK_MS);
    return () => window.clearTimeout(t);
  }, [onDone]);
  return <SpeechBubble text={text} />;
}
```

`src/npc/DruidOverlay.tsx`:
```tsx
import type { ReactNode } from 'react';
import { copy } from '../content/copy';
import { remainingItems, useGame } from '../game/store';
import { Hint } from '../ui/Hint';
import { QuestMarker } from '../ui/QuestMarker';
import { Bark, Greeting, WaitingCue } from './speech';
import './npc.css';

/** Lives inside the druid's DOM anchor: click target, overhead cues and side hint. */
export function DruidOverlay() {
  const g = useGame();
  const itemsLeft = remainingItems(g.inventory).length > 0;

  let overhead: ReactNode = null;
  if (g.druid === 'greeting') overhead = <Greeting onDone={g.greetingDone} />;
  else if (g.bark) overhead = <Bark key={g.barkIndex} text={g.bark} onDone={g.clearBark} />;
  else if (!g.node && itemsLeft) overhead = g.druid === 'waiting' ? <WaitingCue /> : <QuestMarker />;

  return (
    <>
      <button type="button" className="druid-hit" aria-label={copy.druidLabel} onClick={g.talk} />
      <div className="druid-overhead">{overhead}</div>
      {g.druid === 'waiting' && !g.node && (
        <div className="druid-side">
          <Hint text={copy.hint} />
        </div>
      )}
    </>
  );
}
```

`src/npc/npc.css`:
```css
.druid-hit { all: unset; position: absolute; inset: 0; cursor: pointer; }
.druid-hit:focus-visible { outline: 4px dashed var(--gold); }
.druid-overhead {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 12px);
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.druid-side { position: absolute; left: calc(100% + 12px); top: 24px; }
```

- [ ] **Step 7: Replace App**

`src/App.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { SIGN_NAME, SIGN_SUBTITLE } from './content/copy';
import { useGame } from './game/store';
import { DruidOverlay } from './npc/DruidOverlay';
import type { SceneHandle } from './scene/createScene';
import { SceneCanvas } from './scene/SceneCanvas';

export default function App() {
  const [scene, setScene] = useState<SceneHandle | null>(null);
  const [skipIntro] = useState(() => useGame.getState().introSeen);

  useEffect(() => {
    if (!scene) return;
    const s = useGame.getState();
    if (s.druid !== 'offstage') return;
    if (skipIntro) s.setDruid('patrolling');
    else s.startDruidEntrance();
  }, [scene, skipIntro]);

  return (
    <>
      <h1 className="sr-only">
        {SIGN_NAME} — {SIGN_SUBTITLE}
      </h1>
      <SceneCanvas onReady={setScene} druidOverlay={<DruidOverlay />} />
    </>
  );
}
```

- [ ] **Step 8: Type-check, test, and look at it**

Run: `npx tsc && npm test`
Expected: no type errors, all tests PASS.

Run `npm run dev` and check at 1920×1080:
- The town fills the screen, crisp, with no scrollbars.
- The druid walks in from the left in about 5s with a 4-frame walk, and stops at the centre.
- Two greeting bubbles type out above his head. Then a bobbing gold `!` and a "Click the druid to speak." tag appear.
- After 6s the `!` becomes Pim's nudge line.
- His feet sit on the upper street. If not, tune `STREET_Y` in `layout.ts` and `DRUID_SCALE` in `druidSheet.ts`.
- Resize the window: the scene scales, and the bubble stays glued to him.
- Clicking him does nothing visible yet (the dialogue arrives in Task 8).

- [ ] **Step 9: Commit**

```bash
git add src
git commit -m "feat: Pixi scene with walking druid and DOM speech cues"
```

---

### Task 8: Dialogue panel, d20 and dice tray

**Files:**
- Create: `src/dialogue/DialoguePanel.tsx`, `src/dialogue/D20.tsx`, `src/dialogue/Die.tsx`, `src/dialogue/DiceTray.tsx`, `src/dialogue/Portrait.tsx`, `src/dialogue/dialogue.css`
- Modify: `src/App.tsx` (full replacement)
- Test: `src/dialogue/DialoguePanel.test.tsx`

**Interfaces:**
- Consumes: store actions and `DialogueNode` (Task 5); `CHECKS`, `CHECK_ORDER`, `ABILITIES`, `modifierFor` (Task 4); `evaluateHand`, `RoundResult`; `useTypewriter`, `prefersReducedMotion`; `FRAME_W`, `FRAME_H`, `FRAMES`.
- Produces: `<DialoguePanel />` (renders nothing when `node` is null), `<D20 roll modifier dc success onSettled />`, `<Die value hidden? held? onClick? label />`, `<DiceTray />`, `<RoundSummary result />`, `<Portrait />`.

- [ ] **Step 1: Write the failing dialogue tests**

`src/dialogue/DialoguePanel.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { copy } from '../content/copy';
import { INITIAL, useGame } from '../game/store';
import { d20, face, seq } from '../test/rng';
import { DialoguePanel } from './DialoguePanel';

beforeEach(() => {
  localStorage.clear();
  useGame.setState({ ...INITIAL, druid: 'waiting' });
});

describe('DialoguePanel', () => {
  it('renders nothing without a node', () => {
    const { container } = render(<DialoguePanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it('origin → wager → check → natural 20 → both documents', async () => {
    const user = userEvent.setup();
    useGame.setState({ rng: seq(...d20(20)) });
    useGame.getState().talk();
    render(<DialoguePanel />);

    expect(screen.getByText(copy.originPrompt)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /recruiter/i }));
    expect(screen.getByText(/Ghent! Pim/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /The scroll\./ }));
    await user.click(screen.getByRole('button', { name: /Surely a guest rolls first/ }));
    expect(screen.getByText('NATURAL 20')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Let the bones fall/ }));
    expect(screen.getByText(/Take both/)).toBeInTheDocument();
    expect(useGame.getState().inventory).toEqual(['cv', 'letter']);
  });

  it('plays a dice round after a normal check', async () => {
    const user = userEvent.setup();
    useGame.setState({
      origin: 'CHA',
      rng: seq(...d20(15), face(1), face(2), face(4), face(1), face(2), face(4), face(6), face(6), face(6)),
    });
    useGame.getState().talk();
    render(<DialoguePanel />);

    await user.click(screen.getByRole('button', { name: /The letter\./ }));
    await user.click(screen.getByRole('button', { name: /Surely a guest rolls first/ }));
    expect(screen.getByText('SUCCESS')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Let the bones fall/ }));

    await user.click(screen.getByRole('button', { name: copy.dice.reveal }));
    expect(screen.getByText(/said your name/)).toBeInTheDocument();
    expect(useGame.getState().inventory).toEqual(['letter']);
  });

  it('number keys pick choices', async () => {
    const user = userEvent.setup();
    useGame.getState().talk();
    render(<DialoguePanel />);
    await user.keyboard('2');
    expect(useGame.getState().origin).toBe('INT');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/dialogue`
Expected: FAIL, "Failed to resolve import './DialoguePanel'".

- [ ] **Step 3: Implement dice, d20 and portrait components**

`src/dialogue/Die.tsx`:
```tsx
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

interface Props {
  value: number;
  label: string;
  hidden?: boolean;
  held?: boolean;
  onClick?: () => void;
}

export function Die({ value, label, hidden, held, onClick }: Props) {
  const cls = `die${held ? ' die--held' : ''}${hidden ? ' die--hidden' : ''}`;
  const face = hidden ? '?' : Array.from({ length: 9 }, (_, i) => <span key={i} className={PIPS[value].includes(i) ? 'pip' : 'pip pip--off'} />);
  return onClick ? (
    <button type="button" className={cls} aria-pressed={held} aria-label={label} onClick={onClick}>
      {face}
    </button>
  ) : (
    <div className={cls} role="img" aria-label={label}>
      {face}
    </div>
  );
}
```

`src/dialogue/DiceTray.tsx`:
```tsx
import { copy } from '../content/copy';
import { evaluateHand } from '../game/dice';
import type { RoundResult } from '../game/round';
import { useGame } from '../game/store';
import { Die } from './Die';

export function DiceTray() {
  const round = useGame((s) => s.round);
  const toggleHold = useGame((s) => s.toggleHold);
  const reroll = useGame((s) => s.reroll);
  const reveal = useGame((s) => s.revealRound);
  if (!round) return null;

  return (
    <div className="tray">
      <div className="tray-row">
        <span className="tray-who">{copy.dice.ossian}</span>
        {round.ossian.map((d, i) => (
          <Die key={i} value={d} hidden={!round.seeOssian} label={round.seeOssian ? `Ossian's die: ${d}` : "Ossian's die, hidden"} />
        ))}
      </div>
      <div className="tray-row">
        <span className="tray-who">{copy.dice.you}</span>
        {round.player.map((d, i) => (
          // The key changes on reroll, so the die remounts and replays its tumble.
          <Die
            key={`${i}-${d}-${round.rerollsLeft}`}
            value={d}
            held={round.held[i]}
            label={`Your die: ${d}${round.held[i] ? ', held' : ''}`}
            onClick={() => toggleHold(i)}
          />
        ))}
        <span className="tray-hand">{copy.hands[evaluateHand(round.player).rank]}</span>
      </div>
      <div className="tray-actions">
        <button type="button" className="px-btn" disabled={round.rerollsLeft === 0} onClick={reroll}>
          {copy.dice.reroll(round.rerollsLeft)}
        </button>
        <button type="button" className="px-btn px-btn--gold" onClick={reveal}>
          {copy.dice.reveal}
        </button>
      </div>
    </div>
  );
}

export function RoundSummary({ result }: { result: RoundResult }) {
  return (
    <div className="tray">
      <div className="tray-row">
        <span className="tray-who">{copy.dice.ossian}</span>
        {result.ossian.map((d, i) => <Die key={i} value={d} label={`Ossian's die: ${d}`} />)}
        <span className="tray-hand">{copy.hands[result.ossianHand.rank]}</span>
      </div>
      <div className="tray-row">
        <span className="tray-who">{copy.dice.you}</span>
        {result.player.map((d, i) => <Die key={i} value={d} label={`Your die: ${d}`} />)}
        <span className="tray-hand">{copy.hands[result.playerHand.rank]}</span>
      </div>
    </div>
  );
}
```

`src/dialogue/D20.tsx`:
```tsx
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../engine/motion';

const TUMBLE_MS = 900;

interface Props {
  roll: number;
  modifier: number;
  dc: number;
  success: boolean;
  onSettled: () => void;
}

export function D20({ roll, modifier, dc, success, onSettled }: Props) {
  const [instant] = useState(prefersReducedMotion);
  const [face, setFace] = useState(instant ? roll : 1);
  const [settled, setSettled] = useState(instant);
  const dieRef = useRef<HTMLDivElement>(null);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  useEffect(() => {
    if (instant) {
      onSettledRef.current();
      return;
    }
    const flick = window.setInterval(() => setFace(1 + Math.floor(Math.random() * 20)), 70);
    const stop = window.setTimeout(() => {
      window.clearInterval(flick);
      setFace(roll);
      setSettled(true);
      onSettledRef.current();
    }, TUMBLE_MS);
    return () => {
      window.clearInterval(flick);
      window.clearTimeout(stop);
    };
  }, [instant, roll]);

  useGSAP(
    () => {
      if (instant) return;
      if (!settled) {
        gsap.fromTo(dieRef.current, { rotation: 0, y: -40 }, { rotation: 720, y: 0, duration: TUMBLE_MS / 1000, ease: 'bounce.out' });
      } else if (roll === 20) {
        gsap
          .timeline()
          .to(dieRef.current, { scale: 1.5, duration: 0.15, ease: 'power2.out' })
          .to(dieRef.current, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      }
    },
    { dependencies: [settled], scope: dieRef },
  );

  const nat = roll === 20 ? 'nat20' : roll === 1 ? 'nat1' : '';
  return (
    <div className={`d20${settled ? ` d20--settled ${nat}` : ''}`} role="status">
      <div ref={dieRef} className="d20-die">
        <span className="d20-face">{face}</span>
      </div>
      {settled && nat === 'nat20' && <div className="d20-banner">NATURAL 20</div>}
      {settled && nat === 'nat1' && <div className="d20-banner d20-banner--bad">NATURAL 1</div>}
      {settled && (
        <p className="d20-math">
          d20 ({roll}){modifier ? ` + ${modifier}` : ''} = {roll + modifier} vs DC {dc} —{' '}
          <strong className={success ? 'ok' : 'bad'}>{success ? 'SUCCESS' : 'FAILURE'}</strong>
        </p>
      )}
    </div>
  );
}
```

`src/dialogue/Portrait.tsx`:
```tsx
import druidUrl from '../assets/druid.webp';
import { FRAMES, FRAME_H, FRAME_W } from '../npc/druidSheet';

/** Zoom into the first idle frame, centred on Ossian's face. Tune HEAD if the crop is off. */
const ZOOM = 1.5;
const HEAD = { x: 77, y: 52 };
const BOX = 96;

export function Portrait() {
  return (
    <div
      className="portrait"
      aria-hidden="true"
      style={{
        backgroundImage: `url(${druidUrl})`,
        backgroundSize: `${FRAME_W * FRAMES * ZOOM}px ${FRAME_H * ZOOM}px`,
        backgroundPosition: `${-(HEAD.x * ZOOM - BOX / 2)}px ${-(HEAD.y * ZOOM - BOX / 2)}px`,
      }}
    />
  );
}
```

- [ ] **Step 4: Implement the panel**

`src/dialogue/DialoguePanel.tsx`:
```tsx
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useEffect, useRef, useState } from 'react';
import { copy, items } from '../content/copy';
import { prefersReducedMotion } from '../engine/motion';
import { ABILITIES, CHECKS, CHECK_ORDER, modifierFor } from '../game/checks';
import type { RoundResult } from '../game/round';
import { remainingItems, useGame, type DialogueNode, type GameState } from '../game/store';
import { useTypewriter } from '../ui/useTypewriter';
import { D20 } from './D20';
import { DiceTray, RoundSummary } from './DiceTray';
import { Portrait } from './Portrait';
import './dialogue.css';

interface Choice {
  label: string;
  tag?: string;
  onSelect: () => void;
}

interface View {
  lines: string[];
  choices: Choice[];
  d20?: { roll: number; modifier: number; dc: number; success: boolean };
  dice?: boolean;
  result?: RoundResult;
}

const CLOSABLE = new Set<DialogueNode['id']>(['origin', 'wager', 'about', 'check', 'epilogue']);

export function DialoguePanel() {
  const node = useGame((s) => s.node);
  if (!node) return null;
  // Remount per node so the typewriter and d20 restart.
  return <DialogueView key={JSON.stringify(node)} node={node} />;
}

function buildView(node: DialogueNode, g: GameState): View {
  switch (node.id) {
    case 'origin':
      return {
        lines: [copy.originPrompt],
        choices: ABILITIES.map((a) => ({ label: copy.origins[a].label, tag: `${a} +3`, onSelect: () => g.chooseOrigin(a) })),
      };
    case 'wager': {
      const left = remainingItems(g.inventory);
      return {
        lines: [...(node.afterOrigin ? [copy.origins[node.afterOrigin].reply] : []), ...(left.length > 1 ? copy.wagerPrompt : [copy.wagerAgain])],
        choices: [
          ...left.map((i) => ({ label: copy.wagerChoice[i], onSelect: () => g.chooseWager(i) })),
          { label: copy.about, onSelect: g.askAbout },
          { label: copy.farewell, onSelect: g.closeDialogue },
        ],
      };
    }
    case 'about':
      return { lines: copy.aboutReply, choices: [{ label: copy.back, onSelect: g.backToWager }] };
    case 'check':
      return {
        lines: [copy.checkPrompt],
        choices: [
          ...CHECK_ORDER.filter((c) => !g.usedChecks.includes(c)).map((c) => {
            const def = CHECKS[c];
            const mod = modifierFor(g.origin, def.ability);
            return {
              label: copy.checks[c].label,
              tag: `${def.ability} · ${def.skill} · DC ${def.dc}${mod ? ` · +${mod}` : ''}`,
              onSelect: () => g.chooseCheck(c),
            };
          }),
          { label: copy.justRoll, onSelect: g.justRoll },
          { label: copy.farewell, onSelect: g.closeDialogue },
        ],
      };
    case 'rolling': {
      const lines =
        node.roll === 20
          ? []
          : [
              ...(node.roll === 1 ? [copy.nat1] : []),
              node.success ? copy.checks[node.check].success : copy.checks[node.check].fail,
              ...(node.success ? [`(${copy.effects[node.check]})`] : []),
            ];
      return {
        lines,
        d20: { roll: node.roll, modifier: node.modifier, dc: node.dc, success: node.success },
        choices: [{ label: copy.rollContinue, onSelect: g.continueAfterRoll }],
      };
    }
    case 'nat20':
      return {
        lines: [...(node.items.length > 1 ? copy.nat20.both : copy.nat20.last), copy.afterReceive],
        choices: [{ label: copy.nat20.take, onSelect: g.continueDialogue }],
      };
    case 'dice':
      return { lines: [copy.dice.holdHint], choices: [], dice: true };
    case 'roundWon':
      return {
        lines: node.result.pim
          ? [copy.pim, copy.wonItem(items[node.wager].name), copy.afterReceive]
          : [copy.win, ...(node.result.playerHand.rank === 'triple' ? [copy.triple] : []), copy.wonItem(items[node.wager].name), copy.afterReceive],
        result: node.result,
        choices: [{ label: copy.takeIt, onSelect: g.continueDialogue }],
      };
    case 'roundLost':
      return {
        lines: [copy.lose, copy.rematch],
        result: node.result,
        choices: [
          { label: copy.again, onSelect: g.continueDialogue },
          { label: copy.farewell, onSelect: g.closeDialogue },
        ],
      };
    case 'epilogue':
      return { lines: copy.epilogue, choices: [{ label: copy.farewellFinal, onSelect: g.continueDialogue }] };
  }
}

function TypedLines({ text }: { text: string }) {
  const { shown, done, finish } = useTypewriter(text);
  return (
    <p className="dialogue-text" onClick={finish}>
      {done ? text : (
        <>
          <span aria-hidden="true">{shown}</span>
          <span className="sr-only">{text}</span>
        </>
      )}
    </p>
  );
}

function DialogueView({ node }: { node: DialogueNode }) {
  const g = useGame();
  const view = buildView(node, g);
  const [settled, setSettled] = useState(!view.d20);
  const panelRef = useRef<HTMLElement>(null);
  const text = view.lines.join('\n');

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from('.choice', { x: -12, opacity: 0, duration: 0.25, stagger: 0.05, ease: 'steps(3)' });
    },
    { dependencies: [settled], scope: panelRef },
  );

  // Rebind each render so the handler always sees the current choices.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useGame.getState().viewing) return;
      const n = Number(e.key);
      if (settled && Number.isInteger(n) && n >= 1 && n <= view.choices.length) {
        e.preventDefault();
        view.choices[n - 1].onSelect();
      } else if (e.key === 'Escape' && CLOSABLE.has(node.id)) {
        g.closeDialogue();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <section ref={panelRef} className="dialogue px-panel" aria-label="Dialogue with Ossian">
      <Portrait />
      <div className="dialogue-main">
        <h2 className="dialogue-speaker">Ossian</h2>
        {view.d20 && <D20 {...view.d20} onSettled={() => setSettled(true)} />}
        {settled && text && <TypedLines text={text} />}
        {view.result && <RoundSummary result={view.result} />}
        {view.dice && <DiceTray />}
        {settled && view.choices.length > 0 && (
          <ol className="choices">
            {view.choices.map((c, i) => (
              <li key={i}>
                <button type="button" className="choice" onClick={c.onSelect}>
                  <span className="choice-num">{i + 1}.</span>
                  {c.tag && <span className="choice-tag">[{c.tag}]</span>} {c.label}
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
```

`src/dialogue/dialogue.css`:
```css
.dialogue {
  position: fixed;
  left: 50%;
  bottom: 16px;
  z-index: 20;
  transform: translateX(-50%);
  width: min(920px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  display: flex;
  gap: 16px;
  padding: 20px;
}
.portrait {
  flex: none;
  width: 96px;
  height: 96px;
  border: 4px solid var(--outline);
  background-color: #2e3b2a;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  box-shadow: inset 0 0 0 4px var(--gold-dark);
}
.dialogue-main { flex: 1; min-width: 0; }
.dialogue-speaker { margin: 0 0 6px; font-family: var(--font-title); font-weight: normal; font-size: 34px; line-height: 1; color: var(--gold); }
.dialogue-text { margin: 0 0 12px; white-space: pre-line; line-height: 1.35; font-size: 20px; cursor: pointer; }
.choices { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.choice { all: unset; display: block; width: 100%; box-sizing: border-box; padding: 4px 8px; cursor: pointer; line-height: 1.3; }
.choice:hover, .choice:focus-visible { background: rgb(0 0 0 / 0.25); color: #fff6dc; }
.choice-num, .choice-tag { color: var(--gold); margin-right: 8px; }

.d20 { display: grid; justify-items: center; gap: 8px; margin: 4px 0 12px; }
.d20-die {
  width: 88px;
  height: 88px;
  display: grid;
  place-items: center;
  background: var(--red);
  clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
}
.d20-face { font-size: 34px; color: #fff6dc; text-shadow: 3px 3px 0 var(--outline); }
.d20.nat20 .d20-die { background: var(--gold); }
.d20.nat20 .d20-face { color: var(--outline); text-shadow: none; }
.d20-banner { font-family: var(--font-title); font-size: 40px; color: var(--gold); text-shadow: 3px 3px 0 var(--outline); }
.d20-banner--bad { color: #d8604f; }
.d20-math { margin: 0; font-size: 16px; }
.ok { color: #9fd66a; }
.bad { color: #f08a78; }

.tray { background: #2e3b2a; border: 4px solid var(--outline); box-shadow: inset 0 0 0 4px #435a36; padding: 12px; margin-bottom: 12px; display: grid; gap: 10px; }
.tray-row { display: flex; align-items: center; gap: 10px; }
.tray-who { width: 72px; color: var(--gold); }
.tray-hand { margin-left: 8px; font-size: 16px; opacity: 0.85; }
.tray-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.die {
  all: unset;
  box-sizing: border-box;
  width: 52px;
  height: 52px;
  padding: 6px;
  display: grid;
  grid-template: repeat(3, 1fr) / repeat(3, 1fr);
  gap: 2px;
  background: var(--parchment);
  border: 4px solid var(--outline);
  box-shadow: inset -4px -4px 0 var(--parchment-dark);
  animation: die-roll 300ms steps(3);
}
button.die { cursor: pointer; }
button.die:focus-visible { outline: 4px solid var(--gold); }
.die--held { background: #ffe39a; outline: 4px solid var(--gold); translate: 0 -4px; }
.die--hidden { grid-template: 1fr / 1fr; place-items: center; background: var(--wood-dark); color: var(--parchment); font-size: 24px; }
.pip { width: 8px; height: 8px; place-self: center; background: var(--outline); }
.pip--off { background: transparent; }
@keyframes die-roll { 0% { transform: rotate(-20deg) scale(0.8); } 50% { transform: rotate(15deg); } }
```

- [ ] **Step 5: Add the panel to App**

`src/App.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { SIGN_NAME, SIGN_SUBTITLE } from './content/copy';
import { DialoguePanel } from './dialogue/DialoguePanel';
import { useGame } from './game/store';
import { DruidOverlay } from './npc/DruidOverlay';
import type { SceneHandle } from './scene/createScene';
import { SceneCanvas } from './scene/SceneCanvas';

export default function App() {
  const [scene, setScene] = useState<SceneHandle | null>(null);
  const [skipIntro] = useState(() => useGame.getState().introSeen);

  useEffect(() => {
    if (!scene) return;
    const s = useGame.getState();
    if (s.druid !== 'offstage') return;
    if (skipIntro) s.setDruid('patrolling');
    else s.startDruidEntrance();
  }, [scene, skipIntro]);

  return (
    <>
      <h1 className="sr-only">
        {SIGN_NAME} — {SIGN_SUBTITLE}
      </h1>
      <SceneCanvas onReady={setScene} druidOverlay={<DruidOverlay />} />
      <DialoguePanel />
    </>
  );
}
```

- [ ] **Step 6: Run tests, type-check, and play it**

Run: `npx tsc && npm test`
Expected: PASS.

Run `npm run dev`. To replay the intro, clear site data (Application → Storage → Clear), then check:
- Click Ossian: the panel slides in with his portrait (tune `HEAD` in `Portrait.tsx` if the face is off-centre).
- Pick an origin. His reply types, then the wager options appear with numbers, and keys 1–4 work.
- Pick a check: the d20 tumbles about 0.9s and lands. On 20 it pops gold with the "NATURAL 20" banner.
- On a non-20: the dice tray appears, clicking dice toggles hold (gold outline), reroll is limited, and reveal shows both hands.
- Esc closes the panel during origin/wager/check. Afterwards Ossian resumes patrolling.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "feat: dialogue panel with d20 checks and knucklebones tray"
```

---

### Task 9: Satchel, receive effects, document viewers, keyboard

**Files:**
- Create: `src/ui/Satchel.tsx`, `src/ui/ReceiveFx.tsx`, `src/ui/DocumentViewer.tsx`, `src/ui/useGlobalKeys.ts`, `src/ui/ui.css`
- Modify: `src/App.tsx` (full replacement)
- Test: `src/ui/Satchel.test.tsx`

**Interfaces:**
- Consumes: store (`inventory`, `opened`, `satchelOpen`, `justReceived`, `viewing`, `viewingFirstTime`, `setSatchelOpen`, `viewItem`, `ackReceived`, `setContactOpen`, `contactOpen`); `items`, `copy`, `CV_PDF_URL`; `CV`, `MOTIVATION_LETTER`; `PixelArt`, `SATCHEL`, `LEATHER`, `ICONS`, `ITEM`, `SEAL`, `SEAL_PALETTE`; `prefersReducedMotion`.
- Produces: `<Satchel />`, `<ReceiveFx />`, `<DocumentViewer />`, `useGlobalKeys()` (`i` toggles the satchel; Esc closes viewer → contact → satchel, in that order).

- [ ] **Step 1: Write the failing test**

`src/ui/Satchel.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { copy, items } from '../content/copy';
import { CV, MOTIVATION_LETTER } from '../content/documents';
import { INITIAL, useGame } from '../game/store';
import { DocumentViewer } from './DocumentViewer';
import { Satchel } from './Satchel';

beforeEach(() => {
  localStorage.clear();
  useGame.setState({ ...INITIAL });
});

describe('Satchel', () => {
  it('shows an unread badge and opens the scroll', async () => {
    const user = userEvent.setup();
    useGame.setState({ inventory: ['cv'] });
    render(
      <>
        <Satchel />
        <DocumentViewer />
      </>,
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: copy.satchel.open }));
    await user.click(screen.getByRole('button', { name: items.cv.name }));
    expect(screen.getByRole('dialog', { name: items.cv.name })).toBeInTheDocument();
    expect(screen.getByText(CV.title)).toBeInTheDocument();
    expect(useGame.getState().opened).toEqual(['cv']);
    await user.click(screen.getByRole('button', { name: copy.viewer.close }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the letter (seal skipped under reduced motion)', async () => {
    const user = userEvent.setup();
    useGame.setState({ inventory: ['letter'], satchelOpen: true });
    render(
      <>
        <Satchel />
        <DocumentViewer />
      </>,
    );
    await user.click(screen.getByRole('button', { name: items.letter.name }));
    expect(screen.getByText(MOTIVATION_LETTER.salutation)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui/Satchel.test.tsx`
Expected: FAIL, "Failed to resolve import './DocumentViewer'".

- [ ] **Step 3: Implement the satchel**

`src/ui/Satchel.tsx`:
```tsx
import { useState } from 'react';
import { copy, items } from '../content/copy';
import type { ItemId } from '../game/items';
import { useGame } from '../game/store';
import { PixelArt } from '../pixel/PixelArt';
import { ICONS, ITEM, LEATHER, SATCHEL } from '../pixel/sprites';
import './ui.css';

const SLOT_COUNT = 12;

export function Satchel() {
  const inventory = useGame((s) => s.inventory);
  const opened = useGame((s) => s.opened);
  const open = useGame((s) => s.satchelOpen);
  const receiving = useGame((s) => s.justReceived.length > 0);
  const setOpen = useGame((s) => s.setSatchelOpen);
  const viewItem = useGame((s) => s.viewItem);
  const [hovered, setHovered] = useState<ItemId | null>(null);
  const unread = inventory.filter((i) => !opened.includes(i)).length;
  const card = hovered ?? inventory[0] ?? null;

  return (
    <>
      <button
        type="button"
        id="satchel-button"
        className={`satchel-btn${receiving ? ' satchel-btn--wiggle' : ''}`}
        aria-label={copy.satchel.open}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <PixelArt rows={SATCHEL} palette={LEATHER} scale={4} />
        {unread > 0 && <span className="satchel-badge">{unread}</span>}
      </button>
      {unread > 0 && !open && <div className="hint px-parchment satchel-hint">{copy.satchelHint}</div>}
      {open && (
        <aside className="satchel-panel px-panel" aria-label={copy.satchel.title}>
          <h2>{copy.satchel.title}</h2>
          <div className="slots">
            {Array.from({ length: SLOT_COUNT }, (_, i) => {
              const id = inventory[i];
              return id ? (
                <button
                  key={i}
                  type="button"
                  className="slot slot--full"
                  aria-label={items[id].name}
                  onMouseEnter={() => setHovered(id)}
                  onFocus={() => setHovered(id)}
                  onClick={() => viewItem(id)}
                >
                  <PixelArt rows={ICONS[id]} palette={ITEM} scale={3} />
                </button>
              ) : (
                <div key={i} className="slot" />
              );
            })}
          </div>
          {card ? <ItemCard id={card} /> : <p className="satchel-empty">{copy.satchel.empty}</p>}
        </aside>
      )}
    </>
  );
}

function ItemCard({ id }: { id: ItemId }) {
  const it = items[id];
  return (
    <div className={`item-card rarity-${it.rarity.toLowerCase()}`}>
      <h3>{it.name}</h3>
      <p className="item-rarity">{it.rarity}</p>
      <p className="item-flavour">“{it.flavour}”</p>
      <p className="item-weight">
        {copy.satchel.weight} {it.weight}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Implement the receive effect**

The icon arcs from screen centre into the satchel button with a GSAP bezier-ish path (two tweens), then a toast.

`src/ui/ReceiveFx.tsx`:
```tsx
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useEffect, useRef } from 'react';
import { copy, items } from '../content/copy';
import { prefersReducedMotion } from '../engine/motion';
import { useGame } from '../game/store';
import { PixelArt } from '../pixel/PixelArt';
import { ICONS, ITEM } from '../pixel/sprites';
import './ui.css';

const RECEIVE_MS = 2200;

export function ReceiveFx() {
  const id = useGame((s) => s.justReceived[0]);
  const ack = useGame((s) => s.ackReceived);
  const flyRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const t = window.setTimeout(ack, RECEIVE_MS);
    return () => window.clearTimeout(t);
  }, [id, ack]);

  useGSAP(
    () => {
      if (!id || !flyRef.current || !toastRef.current) return;
      if (prefersReducedMotion()) {
        gsap.set(flyRef.current, { opacity: 0 });
        return;
      }
      const target = document.getElementById('satchel-button')?.getBoundingClientRect();
      const toX = target ? target.left + target.width / 2 : window.innerWidth - 56;
      const toY = target ? target.top + target.height / 2 : window.innerHeight / 2;
      const fromX = window.innerWidth / 2;
      const fromY = window.innerHeight * 0.45;
      gsap
        .timeline()
        .set(flyRef.current, { x: fromX, y: fromY, xPercent: -50, yPercent: -50, scale: 2.5, opacity: 1 })
        .to(flyRef.current, { x: (fromX + toX) / 2, y: fromY - 160, scale: 2, duration: 0.45, ease: 'power2.out' })
        .to(flyRef.current, { x: toX, y: toY, scale: 0.8, duration: 0.45, ease: 'power2.in' })
        .to(flyRef.current, { opacity: 0, duration: 0.15 });
      gsap
        .timeline()
        .fromTo(toastRef.current, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'back.out(2)' })
        .to(toastRef.current, { opacity: 0, duration: 0.3, delay: 1.5 });
    },
    { dependencies: [id] },
  );

  if (!id) return null;
  return (
    <>
      <div key={`fly-${id}`} ref={flyRef} className="fly" aria-hidden="true">
        <PixelArt rows={ICONS[id]} palette={ITEM} scale={4} />
      </div>
      <div key={`toast-${id}`} ref={toastRef} className="toast px-parchment" role="status">
        {copy.received(items[id].name)}
      </div>
    </>
  );
}
```

- [ ] **Step 5: Implement the document viewers**

`src/ui/DocumentViewer.tsx`:
```tsx
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useEffect, useRef, useState } from 'react';
import { CV_PDF_URL, copy, items } from '../content/copy';
import { CV, MOTIVATION_LETTER } from '../content/documents';
import { prefersReducedMotion } from '../engine/motion';
import { useGame } from '../game/store';
import { PixelArt } from '../pixel/PixelArt';
import { SEAL, SEAL_PALETTE } from '../pixel/sprites';
import './ui.css';

const SEAL_MS = 900;

export function DocumentViewer() {
  const viewing = useGame((s) => s.viewing);
  const firstTime = useGame((s) => s.viewingFirstTime);
  const viewItem = useGame((s) => s.viewItem);
  if (!viewing) return null;
  const close = () => viewItem(null);
  return (
    <div className="modal-backdrop" onClick={close}>
      <div role="dialog" aria-modal="true" aria-label={items[viewing].name} onClick={(e) => e.stopPropagation()}>
        {viewing === 'cv' ? <ScrollDoc onClose={close} /> : <LetterDoc firstTime={firstTime} onClose={close} />}
      </div>
    </div>
  );
}

function ScrollDoc({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap
        .timeline()
        .from('.scroll-body', { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'power2.out' })
        .from('.scroll-rod--bottom', { y: '-=40vh', duration: 0.7, ease: 'power2.out' }, 0)
        .from('.scroll-body > *', { opacity: 0, y: 6, stagger: 0.05, duration: 0.25 }, 0.4);
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className="scroll-doc">
      <div className="scroll-rod" />
      <article className="scroll-body parchment-hand">
        <h2>{CV.title}</h2>
        <p className="doc-sub">{CV.subtitle}</p>
        {CV.sections.map((s) => (
          <section key={s.heading}>
            <h3>{s.heading}</h3>
            <ul>
              {s.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>
        ))}
        <div className="doc-actions">
          <button type="button" className="px-btn" onClick={onClose}>
            {copy.viewer.close}
          </button>
          {CV_PDF_URL && (
            <a className="px-btn" href={CV_PDF_URL} download>
              {copy.viewer.pdf}
            </a>
          )}
        </div>
      </article>
      <div className="scroll-rod scroll-rod--bottom" />
    </div>
  );
}

function LetterDoc({ firstTime, onClose }: { firstTime: boolean; onClose: () => void }) {
  const [sealed, setSealed] = useState(() => firstTime && !prefersReducedMotion());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sealed) return;
    const t = window.setTimeout(() => setSealed(false), SEAL_MS);
    return () => window.clearTimeout(t);
  }, [sealed]);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      if (sealed) {
        gsap
          .timeline()
          .to('.seal', { rotation: -8, scale: 1.1, duration: 0.2, ease: 'power1.inOut', yoyo: true, repeat: 3 })
          .to('.seal', { scale: 1.6, rotation: 20, opacity: 0, duration: 0.3, ease: 'power2.in' });
      } else {
        gsap.from('.letter-doc', { scaleY: 0.05, duration: 0.5, ease: 'back.out(1.4)' });
      }
    },
    { dependencies: [sealed], scope: ref },
  );

  return (
    <div ref={ref}>
      {sealed ? (
        <div className="letter-sealed">
          <PixelArt rows={SEAL} palette={SEAL_PALETTE} scale={12} className="seal" />
        </div>
      ) : (
        <article className="letter-doc parchment-hand">
          <p>{MOTIVATION_LETTER.salutation}</p>
          {MOTIVATION_LETTER.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p>
            {MOTIVATION_LETTER.signoff}
            <br />
            {MOTIVATION_LETTER.signature}
          </p>
          <p className="letter-flavour">“{items.letter.flavour}”</p>
          <div className="doc-actions">
            <button type="button" className="px-btn" onClick={onClose}>
              {copy.viewer.closeLetter}
            </button>
          </div>
        </article>
      )}
    </div>
  );
}
```

`src/ui/useGlobalKeys.ts`:
```ts
import { useEffect } from 'react';
import { useGame } from '../game/store';

export function useGlobalKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useGame.getState();
      if (e.key === 'i' || e.key === 'I') {
        if (!s.node && !s.viewing) s.setSatchelOpen(!s.satchelOpen);
      } else if (e.key === 'Escape') {
        if (s.viewing) s.viewItem(null);
        else if (s.contactOpen) s.setContactOpen(false);
        else if (s.satchelOpen) s.setSatchelOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
```

`src/ui/ui.css`:
```css
.satchel-btn {
  all: unset;
  position: fixed;
  right: 16px;
  top: 50%;
  z-index: 30;
  translate: 0 -50%;
  padding: 8px;
  cursor: pointer;
  background: var(--wood-dark);
  border: 4px solid var(--outline);
  box-shadow: 0 6px 0 rgb(0 0 0 / 0.35);
}
.satchel-btn:focus-visible { outline: 4px solid var(--gold); }
.satchel-btn--wiggle { animation: wiggle 500ms steps(4) 2; }
@keyframes wiggle { 25% { rotate: -8deg; } 75% { rotate: 8deg; } }
.satchel-badge {
  position: absolute; top: -10px; left: -10px; min-width: 26px; height: 26px;
  display: grid; place-items: center; background: var(--gold); color: var(--outline);
  border: 3px solid var(--outline); font-size: 14px;
}
.satchel-hint { position: fixed; right: 108px; top: 50%; z-index: 30; translate: 0 -50%; }
.satchel-panel { position: fixed; right: 108px; top: 50%; z-index: 30; translate: 0 -50%; width: 300px; padding: 20px; }
.satchel-panel h2 { margin: 0 0 12px; font-family: var(--font-title); font-weight: normal; font-size: 34px; color: var(--gold); }
.slots { display: grid; grid-template-columns: repeat(4, 56px); gap: 6px; margin-bottom: 12px; }
.slot {
  all: unset; box-sizing: border-box; width: 56px; height: 56px; display: grid; place-items: center;
  background: var(--wood-dark); border: 4px solid var(--outline); box-shadow: inset 4px 4px 0 rgb(0 0 0 / 0.35);
}
.slot--full { cursor: pointer; }
.slot--full:hover, .slot--full:focus-visible { outline: 4px solid var(--gold); }
.satchel-empty { margin: 0; opacity: 0.8; }
.item-card { padding: 10px; background: rgb(0 0 0 / 0.25); }
.item-card h3 { margin: 0; font-size: 18px; }
.item-rarity { margin: 2px 0 6px; font-size: 14px; }
.rarity-legendary .item-rarity { color: var(--gold); }
.rarity-rare .item-rarity { color: #7fb6ff; }
.item-flavour { margin: 0 0 6px; font-style: italic; }
.item-weight { margin: 0; font-size: 14px; opacity: 0.8; }

.fly { position: fixed; left: 0; top: 0; z-index: 41; pointer-events: none; opacity: 0; }
.toast { position: fixed; left: 50%; top: 16px; z-index: 40; translate: -50% 0; padding: 10px 18px; }

.modal-backdrop { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 16px; background: rgb(10 6 4 / 0.7); }
.parchment-hand { font-family: var(--font-hand); color: var(--ink); }
.scroll-doc { width: min(680px, calc(100vw - 32px)); }
.scroll-rod {
  position: relative; height: 24px; margin: 0 -16px; background: var(--wood);
  border: 4px solid var(--outline); box-shadow: inset 0 4px 0 var(--wood-light), inset 0 -4px 0 var(--wood-dark);
}
.scroll-body {
  max-height: calc(100vh - 140px); overflow-y: auto; padding: 24px 32px; background: var(--parchment);
  border-left: 4px solid var(--outline); border-right: 4px solid var(--outline);
  box-shadow: inset 8px 0 0 var(--parchment-dark), inset -8px 0 0 var(--parchment-dark); font-size: 20px;
}
.scroll-body h2 { margin: 0; font-size: 40px; text-align: center; }
.doc-sub { margin: 4px 0 16px; text-align: center; font-style: italic; }
.scroll-body h3 { margin: 16px 0 4px; font-size: 24px; color: var(--red); border-bottom: 2px solid var(--parchment-dark); }
.scroll-body ul { margin: 0; padding-left: 20px; }
.doc-actions { display: flex; gap: 12px; justify-content: center; margin-top: 20px; font-family: var(--font-ui); }
.letter-doc {
  width: min(620px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow-y: auto; padding: 32px;
  background: var(--parchment); border: 4px solid var(--outline); box-shadow: inset 0 0 0 8px var(--parchment-dark);
  font-size: 20px; transform-origin: 50% 0;
}
.letter-flavour { font-style: italic; text-align: center; opacity: 0.8; }
.letter-sealed { display: grid; place-items: center; }
```

- [ ] **Step 6: Add them to App**

`src/App.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { SIGN_NAME, SIGN_SUBTITLE } from './content/copy';
import { DialoguePanel } from './dialogue/DialoguePanel';
import { useGame } from './game/store';
import { DruidOverlay } from './npc/DruidOverlay';
import type { SceneHandle } from './scene/createScene';
import { SceneCanvas } from './scene/SceneCanvas';
import { DocumentViewer } from './ui/DocumentViewer';
import { ReceiveFx } from './ui/ReceiveFx';
import { Satchel } from './ui/Satchel';
import { useGlobalKeys } from './ui/useGlobalKeys';

export default function App() {
  const [scene, setScene] = useState<SceneHandle | null>(null);
  const [skipIntro] = useState(() => useGame.getState().introSeen);
  useGlobalKeys();

  useEffect(() => {
    if (!scene) return;
    const s = useGame.getState();
    if (s.druid !== 'offstage') return;
    if (skipIntro) s.setDruid('patrolling');
    else s.startDruidEntrance();
  }, [scene, skipIntro]);

  return (
    <>
      <h1 className="sr-only">
        {SIGN_NAME} — {SIGN_SUBTITLE}
      </h1>
      <SceneCanvas onReady={setScene} druidOverlay={<DruidOverlay />} />
      <Satchel />
      <DialoguePanel />
      <ReceiveFx />
      <DocumentViewer />
    </>
  );
}
```

- [ ] **Step 7: Run tests, type-check, and play it**

Run: `npx tsc && npm test`
Expected: PASS.

In `npm run dev`, check:
- Win an item: its icon arcs into the satchel, the toast drops in, the satchel wiggles, and a badge plus hint appear.
- `i` opens the satchel. Hovering a slot shows its item card.
- Clicking the scroll unrolls it top-down and the lines fade in.
- The letter's first open: the seal shakes and bursts, then the letter unfolds. On the second open it goes straight to the letter.
- Esc closes, in order: viewer, then satchel.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat: satchel inventory, receive effects and document viewers"
```

---

### Task 10: Tavern sign, torches, intro timeline and splash

The sign is built in Pixi: an iron beam on two rods, two torches, chains, a carved board, and Pixi `Text` in Jacquard 24. A GSAP timeline plays the intro: dusk, left torch, right torch, sign lights and swings, dusk lifts. Then the druid enters.

**Files:**
- Create: `src/scene/colorMatrix.ts`, `src/scene/radialTexture.ts`, `src/scene/titleSign.ts`, `src/scene/intro.ts`, `src/scene/useSceneIntro.ts`
- Create: `src/ui/Splash.tsx`, `src/ui/splash.css`
- Modify: `src/App.tsx` (full replacement)
- Test: `src/scene/colorMatrix.test.ts`

**Interfaces:**
- Consumes: `SceneHandle` (`app`, `layers`, `world`); `pixelTexture`; `barRows`, `chainRows`, `signBoardRows`, `TORCH`, `FLAMES`, `IRON`, `IRON_WOOD`, `FLAME`, `WOOD`; `SIGN`; `SIGN_NAME`, `SIGN_SUBTITLE`; `prefersReducedMotion`.
- Produces:
  - `colorMatrix.ts` (pure): `IDENTITY`, `DUSK`, `lerpMatrix(a, b, t): number[]`.
  - `radialTexture(size, rgb: [r, g, b]): Texture`.
  - `createTitleSign(h): Promise<TitleSign>`. `TitleSign` has `root: Container`, `swing: Container`, `torches: Torch[]` (each `{ root, flame, glow, x, y }`, where `x, y` is the flame's world position), `board: Container`, `boardFilter: ColorMatrixFilter`, `glowFilter: GlowFilter`, `destroy()`.
  - `playIntro(h, sign, opts: { skip: boolean; onIgnite?: (x: number, y: number) => void }): { done: Promise<void>; kill(): void }`.
  - `useSceneIntro(scene: SceneHandle | null, skip: boolean, onIgnite?): { ready: boolean }`. Starts the druid (entrance, or patrol when `skip`) when the intro finishes.
  - `<Splash visible />`.

- [ ] **Step 1: Write the failing test**

`src/scene/colorMatrix.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { DUSK, IDENTITY, lerpMatrix } from './colorMatrix';

describe('lerpMatrix', () => {
  it('returns the endpoints at 0 and 1', () => {
    expect(lerpMatrix(IDENTITY, DUSK, 0)).toEqual(IDENTITY);
    expect(lerpMatrix(IDENTITY, DUSK, 1)).toEqual(DUSK);
  });

  it('blends element-wise', () => {
    expect(lerpMatrix(IDENTITY, DUSK, 0.5)[0]).toBeCloseTo((IDENTITY[0] + DUSK[0]) / 2);
    expect(lerpMatrix(IDENTITY, DUSK, 0.5)).toHaveLength(20);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/scene/colorMatrix.test.ts`
Expected: FAIL, "Failed to resolve import './colorMatrix'".

- [ ] **Step 3: Implement the colour matrices**

`src/scene/colorMatrix.ts`:
```ts
/** 4×5 colour matrices (row-major) for Pixi's ColorMatrixFilter. No Pixi import: unit-testable. */
export const IDENTITY = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

/** Cold, dark blue evening. */
export const DUSK = [0.42, 0, 0, 0, 0.0, 0, 0.48, 0, 0, 0.01, 0, 0, 0.78, 0, 0.05, 0, 0, 0, 1, 0];

export function lerpMatrix(a: readonly number[], b: readonly number[], t: number): number[] {
  return a.map((v, i) => v + (b[i] - v) * t);
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/scene/colorMatrix.test.ts`
Expected: PASS.

- [ ] **Step 5: Build the sign**

`src/scene/radialTexture.ts`:
```ts
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
```

`src/scene/titleSign.ts`:
```ts
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
```

- [ ] **Step 6: Write the intro timeline and the React hook**

`src/scene/intro.ts`:
```ts
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
    dusk.matrix = lerpMatrix(IDENTITY, DUSK, state.dusk) as typeof dusk.matrix;
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
      idle.play();
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
```

`src/scene/useSceneIntro.ts`:
```ts
import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import type { SceneHandle } from './createScene';
import { playIntro } from './intro';
import { createTitleSign, type TitleSign } from './titleSign';

const SPLASH_MIN_MS = 700;

/** Builds the sign, plays the intro, then brings the druid on stage. */
export function useSceneIntro(scene: SceneHandle | null, skip: boolean, onIgnite?: (x: number, y: number) => void) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!scene) return;
    let cancelled = false;
    let sign: TitleSign | null = null;
    let kill = () => {};

    (async () => {
      const [built] = await Promise.all([createTitleSign(scene), new Promise((r) => setTimeout(r, SPLASH_MIN_MS))]);
      if (cancelled) {
        built.destroy();
        return;
      }
      sign = built;
      setReady(true);
      const intro = playIntro(scene, built, { skip, onIgnite });
      kill = intro.kill;
      await intro.done;
      if (cancelled) return;
      const s = useGame.getState();
      if (s.druid !== 'offstage') return;
      if (skip) s.setDruid('patrolling');
      else s.startDruidEntrance();
    })();

    return () => {
      cancelled = true;
      kill();
      sign?.destroy();
    };
    // onIgnite is read once when the intro starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, skip]);

  return { ready };
}
```

`src/ui/Splash.tsx`:
```tsx
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useRef, useState } from 'react';
import { copy } from '../content/copy';
import './splash.css';

export function Splash({ visible }: { visible: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  useGSAP(
    () => {
      if (visible) return;
      gsap.to(ref.current, { opacity: 0, duration: 0.4, ease: 'steps(4)', onComplete: () => setGone(true) });
    },
    { dependencies: [visible] },
  );
  if (gone) return null;
  return (
    <div ref={ref} className="splash" role="status">
      <div className="splash-d20">20</div>
      <p>{copy.loading}</p>
    </div>
  );
}
```

`src/ui/splash.css`:
```css
.splash { position: fixed; inset: 0; z-index: 100; display: grid; place-content: center; justify-items: center; gap: 16px; background: var(--letterbox); font-size: 20px; }
.splash-d20 {
  width: 72px; height: 72px; display: grid; place-items: center; background: var(--red); color: #fff6dc; font-size: 28px;
  clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  animation: spin 0.6s steps(6) infinite;
}
```

- [ ] **Step 7: Wire it into App**

`src/App.tsx`:
```tsx
import { useState } from 'react';
import { SIGN_NAME, SIGN_SUBTITLE } from './content/copy';
import { DialoguePanel } from './dialogue/DialoguePanel';
import { useGame } from './game/store';
import { DruidOverlay } from './npc/DruidOverlay';
import type { SceneHandle } from './scene/createScene';
import { SceneCanvas } from './scene/SceneCanvas';
import { useSceneIntro } from './scene/useSceneIntro';
import { DocumentViewer } from './ui/DocumentViewer';
import { ReceiveFx } from './ui/ReceiveFx';
import { Satchel } from './ui/Satchel';
import { Splash } from './ui/Splash';
import { useGlobalKeys } from './ui/useGlobalKeys';

export default function App() {
  const [scene, setScene] = useState<SceneHandle | null>(null);
  const [skipIntro] = useState(() => useGame.getState().introSeen);
  const { ready } = useSceneIntro(scene, skipIntro);
  useGlobalKeys();

  return (
    <>
      <h1 className="sr-only">
        {SIGN_NAME} — {SIGN_SUBTITLE}
      </h1>
      <SceneCanvas onReady={setScene} druidOverlay={<DruidOverlay />} />
      <Satchel />
      <DialoguePanel />
      <ReceiveFx />
      <DocumentViewer />
      <Splash visible={!ready} />
    </>
  );
}
```

- [ ] **Step 8: Type-check, test, and watch the intro**

Run: `npx tsc && npm test`
Expected: PASS. If tsc complains about the `dusk.matrix` cast or the `GlowFilter` options, check the installed `.d.ts` files (`node_modules/pixi.js/lib/filters/defaults/color-matrix/ColorMatrixFilter.d.ts`, `node_modules/pixi-filters/lib/glow/GlowFilter.d.ts`) and match their option names. Keep the behaviour.

Clear site data, then run `npm run dev`:
- The splash shows a spinning d20 and "Rolling for initiative…", then fades.
- The town is cold blue. The left torch pops alight, then the right. Each has a warm additive glow.
- The board brightens in steps, "The Ink & Antler" flares with a gold glow, and the sign swings and settles elastically.
- Dusk lifts to day in steps, then Ossian walks in.
- Afterwards the torches flicker and the sign sways gently every ~6s.
- Reload: no intro. The sign is lit and Ossian is already patrolling.
- Check that the `ł` in the subtitle renders in Pixelify Sans. If it shows a box or falls back to another font, set `NAME = 'Michal Kulijewicz'` in `src/content/copy.ts`.
- Check the 1280×720 and 1440×900 window sizes: the sign isn't cropped.

- [ ] **Step 9: Commit**

```bash
git add src
git commit -m "feat: tavern sign with torches and GSAP intro timeline"
```

---

### Task 11: Particles, ambient life, nat-20 celebration, signpost and chrome

**Files:**
- Create: `src/scene/particles.ts` (pure), `src/scene/particleLayer.ts`, `src/scene/ambient.ts`, `src/scene/useSceneFx.ts`
- Create: `src/world/SignpostHotspot.tsx`, `src/ui/ContactModal.tsx`, `src/ui/TopBar.tsx`, `src/ui/PortraitGate.tsx`, `src/ui/chrome.css`
- Modify: `src/App.tsx` (final version)
- Test: `src/scene/particles.test.ts`

**Interfaces:**
- Consumes: `SceneHandle` (`app`, `layers`, `world`, `onTick`, `pinAnchor`, `druidPosition`); `radialTexture`, `pixelTexture`; `SIGNPOST`, `FORGE`, `CHIMNEYS`, `WORLD_W`; `SIGNPOST` map + `WOOD`, `CLOUD` + `CLOUD_PALETTE`; store (`celebrate`, `inventory`, `contactSeen`, `contactOpen`, `setContactOpen`, `skipTale`, `resetTale`, `viewing`); `QuestMarker`; `CONTACT`, `copy`.
- Produces:
  - `particles.ts`: `interface Particle`, `interface EmitSpec`, `emit(spec, rng): Particle[]`, `stepParticles(ps, dtMs): Particle[]`, `particleAlpha(p): number`, and presets `SPARKS`, `EMBERS`, `SMOKE`, `GOLD_BURST` (functions `(x, y) => EmitSpec`).
  - `particleLayer.ts`: `createParticleLayer(h): ParticleLayer` with `burst(spec)`, `addEmitter(make: () => EmitSpec, perSecond): () => void`, `destroy()`.
  - `ambient.ts`: `setupAmbient(h, particles): () => void`.
  - `useSceneFx(scene): RefObject<SceneFx | null>`, where `SceneFx = { ignite(x, y): void }`. It also plays the celebration when `celebrate` changes.
  - `<SignpostHotspot scene />`, `<ContactModal />`, `<TopBar />`, `<PortraitGate />`.

- [ ] **Step 1: Write the failing particle tests**

`src/scene/particles.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { seq } from '../test/rng';
import { emit, particleAlpha, stepParticles, type EmitSpec } from './particles';

const spec: EmitSpec = {
  x: 100, y: 200, count: 5, speed: [100, 100], angle: [0, 0], life: [1000, 1000],
  size: [4, 4], grow: 0, gravity: 0, colors: [0xffffff], alpha: 1,
};

describe('emit', () => {
  it('creates count particles at the origin within the ranges', () => {
    const ps = emit(spec, seq(0.5));
    expect(ps).toHaveLength(5);
    expect(ps[0]).toMatchObject({ x: 100, y: 200, vx: 100, vy: 0, life: 1000, maxLife: 1000, size: 4 });
  });
});

describe('stepParticles', () => {
  it('moves by velocity, applies gravity, ages and removes the dead', () => {
    const [p] = emit({ ...spec, count: 1, gravity: 100 }, seq(0.5));
    const [q] = stepParticles([p], 500);
    expect(q.x).toBeCloseTo(150);
    expect(q.vy).toBeCloseTo(50);
    expect(q.life).toBe(500);
    expect(particleAlpha(q)).toBeCloseTo(0.5);
    expect(stepParticles([q], 600)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/scene/particles.test.ts`
Expected: FAIL, "Failed to resolve import './particles'".

- [ ] **Step 3: Implement the pure particle model**

`src/scene/particles.ts`:
```ts
import type { Rng } from '../game/dice';

/** Pure particle model. Positions in world px, velocities in px/s, gravity in px/s². */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  grow: number;
  gravity: number;
  color: number;
  alpha0: number;
}

export interface EmitSpec {
  x: number;
  y: number;
  count: number;
  speed: [number, number];
  /** Radians; 0 = right, -π/2 = up. */
  angle: [number, number];
  life: [number, number];
  size: [number, number];
  /** Size change in px per second. */
  grow: number;
  gravity: number;
  colors: number[];
  alpha: number;
}

const between = (rng: Rng, [a, b]: [number, number]) => a + (b - a) * rng();

export function emit(spec: EmitSpec, rng: Rng): Particle[] {
  return Array.from({ length: spec.count }, () => {
    const speed = between(rng, spec.speed);
    const angle = between(rng, spec.angle);
    const life = between(rng, spec.life);
    return {
      x: spec.x,
      y: spec.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      size: between(rng, spec.size),
      grow: spec.grow,
      gravity: spec.gravity,
      color: spec.colors[Math.floor(rng() * spec.colors.length) % spec.colors.length],
      alpha0: spec.alpha,
    };
  });
}

export function stepParticles(ps: readonly Particle[], dtMs: number): Particle[] {
  const dt = dtMs / 1000;
  const out: Particle[] = [];
  for (const p of ps) {
    const life = p.life - dtMs;
    if (life <= 0) continue;
    out.push({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, vy: p.vy + p.gravity * dt, size: Math.max(1, p.size + p.grow * dt), life });
  }
  return out;
}

export function particleAlpha(p: Particle): number {
  return p.alpha0 * (p.life / p.maxLife);
}

const UP = -Math.PI / 2;

export const SPARKS = (x: number, y: number): EmitSpec => ({
  x, y, count: 18, speed: [80, 220], angle: [UP - 1.1, UP + 1.1], life: [300, 700],
  size: [3, 6], grow: -4, gravity: 420, colors: [0xfff3a0, 0xffb52e, 0xe0561b], alpha: 1,
});

export const EMBERS = (x: number, y: number): EmitSpec => ({
  x, y, count: 1, speed: [20, 50], angle: [UP - 0.4, UP + 0.4], life: [800, 1600],
  size: [3, 4], grow: -1.5, gravity: -10, colors: [0xffb52e, 0xe0561b], alpha: 0.9,
});

export const SMOKE = (x: number, y: number): EmitSpec => ({
  x, y, count: 1, speed: [15, 30], angle: [UP - 0.2, UP + 0.35], life: [2500, 3800],
  size: [8, 12], grow: 10, gravity: -4, colors: [0xdcdce1, 0xc4c4cc], alpha: 0.5,
});

export const GOLD_BURST = (x: number, y: number): EmitSpec => ({
  x, y, count: 90, speed: [150, 480], angle: [0, Math.PI * 2], life: [700, 1500],
  size: [4, 9], grow: -3, gravity: 380, colors: [0xe8b04a, 0xfff3a0, 0xffffff, 0xa8741e], alpha: 1,
});
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/scene/particles.test.ts`
Expected: PASS.

- [ ] **Step 5: Render particles and ambient life in Pixi**

`src/scene/particleLayer.ts`:
```ts
import { Container, Sprite, Texture } from 'pixi.js';
import type { SceneHandle } from './createScene';
import { emit, particleAlpha, stepParticles, type EmitSpec, type Particle } from './particles';

export interface ParticleLayer {
  burst(spec: EmitSpec): void;
  /** Emits `make()` about perSecond times per second until the returned stop() is called. */
  addEmitter(make: () => EmitSpec, perSecond: number): () => void;
  destroy(): void;
}

/** Square pixel particles: pooled 1×1 white sprites, tinted and scaled. */
export function createParticleLayer(h: SceneHandle): ParticleLayer {
  const layer = new Container();
  h.layers.front.addChild(layer);
  const pool: Sprite[] = [];
  let particles: Particle[] = [];
  const emitters = new Set<{ make: () => EmitSpec; interval: number; acc: number }>();

  const stopTick = h.onTick((dt) => {
    emitters.forEach((e) => {
      e.acc += dt;
      while (e.acc >= e.interval) {
        e.acc -= e.interval;
        particles.push(...emit(e.make(), Math.random));
      }
    });
    particles = stepParticles(particles, dt);
    while (pool.length < particles.length) {
      const s = new Sprite(Texture.WHITE);
      s.anchor.set(0.5);
      layer.addChild(s);
      pool.push(s);
    }
    pool.forEach((s, i) => {
      const p = particles[i];
      s.visible = !!p;
      if (!p) return;
      s.position.set(Math.round(p.x), Math.round(p.y));
      s.width = s.height = Math.round(p.size);
      s.tint = p.color;
      s.alpha = particleAlpha(p);
    });
  });

  return {
    burst: (spec) => particles.push(...emit(spec, Math.random)),
    addEmitter(make, perSecond) {
      const e = { make, interval: 1000 / perSecond, acc: 0 };
      emitters.add(e);
      return () => emitters.delete(e);
    },
    destroy() {
      stopTick();
      layer.destroy({ children: true });
    },
  };
}
```

`src/scene/ambient.ts`:
```ts
import gsap from 'gsap';
import { Sprite } from 'pixi.js';
import { CLOUD, CLOUD_PALETTE, SIGNPOST as SIGNPOST_ROWS, WOOD } from '../pixel/sprites';
import { CHIMNEYS, FORGE, SIGNPOST, WORLD_W } from '../world/layout';
import type { SceneHandle } from './createScene';
import type { ParticleLayer } from './particleLayer';
import { EMBERS, SMOKE } from './particles';
import { pixelTexture } from './pixelTexture';
import { radialTexture } from './radialTexture';

/** Forge glow, embers, chimney smoke, a drifting cloud and the signpost. Returns a cleanup. */
export function setupAmbient(h: SceneHandle, particles: ParticleLayer | null): () => void {
  const r = h.app.renderer;

  const cloud = new Sprite(pixelTexture(r, CLOUD, CLOUD_PALETTE));
  cloud.scale.set(6);
  cloud.position.set(-200, 70);
  cloud.alpha = 0.9;
  h.layers.back.addChild(cloud);
  const drift = gsap.to(cloud, { x: WORLD_W + 200, duration: 140, ease: 'none', repeat: -1 });

  const forge = new Sprite(radialTexture(128, [255, 130, 40]));
  forge.anchor.set(0.5);
  forge.scale.set(1.6);
  forge.blendMode = 'add';
  forge.position.set(FORGE.x, FORGE.y);
  h.layers.back.addChild(forge);
  const flicker = gsap.to(forge, { alpha: 0.55, duration: 0.18, ease: 'steps(2)', yoyo: true, repeat: -1 });

  const post = new Sprite(pixelTexture(r, SIGNPOST_ROWS, WOOD));
  post.scale.set(5);
  post.position.set(SIGNPOST.x - 40, SIGNPOST.feetY - 120);
  h.layers.back.addChild(post);

  const stops = particles
    ? [
        particles.addEmitter(() => EMBERS(FORGE.x + (Math.random() - 0.5) * 30, FORGE.y), 6),
        ...CHIMNEYS.map((c) => particles.addEmitter(() => SMOKE(c.x, c.y), 1.2)),
      ]
    : [];

  return () => {
    drift.kill();
    flicker.kill();
    stops.forEach((s) => s());
    [cloud, forge, post].forEach((s) => s.destroy());
  };
}
```

`src/scene/useSceneFx.ts`:
```ts
import gsap from 'gsap';
import { AdvancedBloomFilter } from 'pixi-filters';
import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../engine/motion';
import { useGame } from '../game/store';
import { setupAmbient } from './ambient';
import type { SceneHandle } from './createScene';
import { createParticleLayer, type ParticleLayer } from './particleLayer';
import { EMBERS, GOLD_BURST, SPARKS } from './particles';

export interface SceneFx {
  ignite(x: number, y: number): void;
}

/** Particles, ambient life and the natural-20 celebration. */
export function useSceneFx(scene: SceneHandle | null) {
  const fx = useRef<SceneFx | null>(null);

  useEffect(() => {
    if (!scene) return;
    const calm = prefersReducedMotion();
    const particles: ParticleLayer | null = calm ? null : createParticleLayer(scene);
    const stopAmbient = setupAmbient(scene, particles);
    const stops: (() => void)[] = [];

    fx.current = {
      ignite(x, y) {
        if (!particles) return;
        particles.burst(SPARKS(x, y));
        stops.push(particles.addEmitter(() => EMBERS(x + (Math.random() - 0.5) * 10, y), 3));
      },
    };

    const bloom = new AdvancedBloomFilter({ threshold: 0.45, bloomScale: 0, brightness: 1, blur: 6, quality: 4 });
    const unsubscribe = useGame.subscribe((s, prev) => {
      if (s.celebrate === prev.celebrate || calm) return;
      const at = scene.druidPosition() ?? { x: 960, y: 628 };
      particles?.burst(GOLD_BURST(at.x, at.y - 170));
      scene.world.filters = [bloom];
      gsap
        .timeline({ onComplete: () => (scene.world.filters = []) })
        .to(bloom, { bloomScale: 1.6, brightness: 1.25, duration: 0.2, ease: 'power2.out' })
        .to(bloom, { bloomScale: 0, brightness: 1, duration: 1.2, ease: 'power2.in' });
    });

    return () => {
      unsubscribe();
      stops.forEach((s) => s());
      stopAmbient();
      particles?.destroy();
      fx.current = null;
    };
  }, [scene]);

  return fx;
}
```

- [ ] **Step 6: Signpost hotspot, contact, top bar, portrait gate**

`src/world/SignpostHotspot.tsx`:
```tsx
import { useEffect, useRef } from 'react';
import { copy } from '../content/copy';
import { remainingItems, useGame } from '../game/store';
import type { SceneHandle } from '../scene/createScene';
import { QuestMarker } from '../ui/QuestMarker';
import { SIGNPOST } from './layout';
import '../ui/chrome.css';

const W = 80;
const H = 120;

export function SignpostHotspot({ scene }: { scene: SceneHandle | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const marked = useGame((s) => remainingItems(s.inventory).length === 0 && !s.contactSeen);
  const open = useGame((s) => s.setContactOpen);

  useEffect(() => {
    if (!scene || !ref.current) return;
    return scene.pinAnchor(ref.current, SIGNPOST.x - W / 2, SIGNPOST.feetY - H);
  }, [scene]);

  return (
    <div ref={ref} className="anchor" style={{ width: W, height: H, display: scene ? undefined : 'none' }}>
      {marked && (
        <div className="signpost-marker">
          <QuestMarker />
        </div>
      )}
      <button type="button" className="signpost-hit" aria-label={copy.contact.label} onClick={() => open(true)} />
    </div>
  );
}
```

`src/ui/ContactModal.tsx`:
```tsx
import { CONTACT, copy } from '../content/copy';
import { useGame } from '../game/store';
import './chrome.css';

export function ContactModal() {
  const isOpen = useGame((s) => s.contactOpen);
  const setOpen = useGame((s) => s.setContactOpen);
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop" onClick={() => setOpen(false)}>
      <div className="contact px-parchment parchment-hand" role="dialog" aria-modal="true" aria-label={copy.contact.title} onClick={(e) => e.stopPropagation()}>
        <h2>{copy.contact.title}</h2>
        <p>{copy.contact.intro}</p>
        <ul>
          <li>
            <a href={`mailto:${CONTACT.email}`}>
              {copy.contact.email}: {CONTACT.email}
            </a>
          </li>
          <li>
            <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">
              {copy.contact.linkedin}
            </a>
          </li>
        </ul>
        <button type="button" className="px-btn" onClick={() => setOpen(false)}>
          {copy.contact.close}
        </button>
      </div>
    </div>
  );
}
```

`src/ui/TopBar.tsx`:
```tsx
import { copy } from '../content/copy';
import { useGame } from '../game/store';
import './chrome.css';

export function TopBar() {
  const skip = useGame((s) => s.skipTale);
  const reset = useGame((s) => s.resetTale);
  return (
    <nav className="topbar" aria-label="Shortcuts">
      <button
        type="button"
        className="px-btn px-btn--small"
        onClick={() => {
          reset();
          window.location.reload();
        }}
      >
        {copy.reset}
      </button>
      <button type="button" className="px-btn px-btn--gold" onClick={skip}>
        {copy.skip}
      </button>
    </nav>
  );
}
```

`src/ui/PortraitGate.tsx`:
```tsx
import { copy } from '../content/copy';
import { useGame } from '../game/store';
import './chrome.css';

/** Shown only on narrow portrait screens (see chrome.css). */
export function PortraitGate() {
  const skip = useGame((s) => s.skipTale);
  return (
    <div className="portrait-gate">
      <div className="px-parchment portrait-gate-card">
        <p>{copy.portraitGate.text}</p>
        <button type="button" className="px-btn" onClick={skip}>
          {copy.portraitGate.anyway}
        </button>
      </div>
    </div>
  );
}
```

`src/ui/chrome.css`:
```css
.topbar { position: fixed; top: 16px; right: 16px; z-index: 35; display: flex; gap: 8px; align-items: center; }
.signpost-hit { all: unset; position: absolute; inset: 0; cursor: pointer; }
.signpost-hit:focus-visible { outline: 4px dashed var(--gold); }
.signpost-marker { position: absolute; left: 50%; bottom: calc(100% + 8px); translate: -50% 0; }
.contact { width: min(520px, calc(100vw - 32px)); padding: 28px; font-size: 20px; }
.contact h2 { margin: 0 0 12px; font-size: 36px; text-align: center; }
.contact ul { padding-left: 20px; }
.contact a { color: var(--red); }
.portrait-gate { display: none; }
@media (orientation: portrait) and (max-width: 900px) {
  .portrait-gate { position: fixed; inset: 0; z-index: 60; display: grid; place-content: center; padding: 24px; background: var(--letterbox); }
  .portrait-gate-card { padding: 24px; text-align: center; font-size: 20px; }
}
```

- [ ] **Step 7: Final App**

`src/App.tsx`:
```tsx
import { useState } from 'react';
import { SIGN_NAME, SIGN_SUBTITLE } from './content/copy';
import { DialoguePanel } from './dialogue/DialoguePanel';
import { useGame } from './game/store';
import { DruidOverlay } from './npc/DruidOverlay';
import type { SceneHandle } from './scene/createScene';
import { SceneCanvas } from './scene/SceneCanvas';
import { useSceneFx } from './scene/useSceneFx';
import { useSceneIntro } from './scene/useSceneIntro';
import { ContactModal } from './ui/ContactModal';
import { DocumentViewer } from './ui/DocumentViewer';
import { PortraitGate } from './ui/PortraitGate';
import { ReceiveFx } from './ui/ReceiveFx';
import { Satchel } from './ui/Satchel';
import { Splash } from './ui/Splash';
import { TopBar } from './ui/TopBar';
import { useGlobalKeys } from './ui/useGlobalKeys';
import { SignpostHotspot } from './world/SignpostHotspot';

export default function App() {
  const [scene, setScene] = useState<SceneHandle | null>(null);
  const [skipIntro] = useState(() => useGame.getState().introSeen);
  const fx = useSceneFx(scene);
  // fx is a ref; the intro reads it when each torch lights.
  const { ready } = useSceneIntro(scene, skipIntro, (x, y) => fx.current?.ignite(x, y));
  const viewing = useGame((s) => s.viewing);
  useGlobalKeys();

  return (
    <>
      <h1 className="sr-only">
        {SIGN_NAME} — {SIGN_SUBTITLE}
      </h1>
      <SceneCanvas onReady={setScene} druidOverlay={<DruidOverlay />} />
      <SignpostHotspot scene={scene} />
      <TopBar />
      <Satchel />
      <DialoguePanel />
      <ReceiveFx />
      <DocumentViewer />
      <ContactModal />
      {!viewing && <PortraitGate />}
      <Splash visible={!ready} />
    </>
  );
}
```

- [ ] **Step 8: Type-check, test, and play the whole tale**

Run: `npx tsc && npm test`
Expected: PASS.

Clear site data and play through in `npm run dev`:
- When each torch lights, sparks spray up. Small embers keep rising from both torches and the forge. Smoke drifts from the two chimneys (tune `CHIMNEYS`/`FORGE` in `layout.ts` to match the bg). A pixel cloud crosses the sky slowly.
- Roll a natural 20: a gold pixel burst from above Ossian, a bloom flash, then both items fly to the satchel.
- After both items: the epilogue, then a gold `!` over the signpost by the stairs. Clicking the signpost opens the contact parchment and the marker disappears.
- "Skip the tale →" opens the CV directly. "Begin anew" replays the intro.
- With DevTools emulating `prefers-reduced-motion: reduce`: no particles, no tumble, instant text, and the scene is still fully usable.
- With a narrow portrait window (device toolbar, iPhone): the turn-your-device card appears, and "Read the scroll anyway" opens the CV above it.
- Watch the FPS in the DevTools performance monitor: 60 fps on a laptop while idle.

- [ ] **Step 9: Commit**

```bash
git add src
git commit -m "feat: particles, ambient life, nat-20 celebration, signpost and chrome"
```

---

### Task 12: Size budget and Vercel handoff

**Files:**
- Create: `README.md`

- [ ] **Step 1: Build and measure**

```bash
npm run build
for f in dist/assets/*.js; do printf '%s %s KB gz\n' "$f" $(( $(gzip -c "$f" | wc -c) / 1024 )); done
du -sh dist
```
Expected: total JS gzip < 260 KB, and `dist` < 1.2 MB. If JS is over:
1. Check Pixi is imported only through named imports from `pixi.js` (so it tree-shakes).
2. Lazy-load the document viewer: `const DocumentViewer = lazy(() => import('./ui/DocumentViewer').then(m => ({ default: m.DocumentViewer })))`, wrapped in `<Suspense fallback={null}>`.
3. Re-measure.

- [ ] **Step 2: Preview the production build**

Run: `npm run preview`, open the printed URL, and play once through. Expected: identical to dev, no console errors.

- [ ] **Step 3: Write the README**

`README.md`:
````markdown
# The Ink & Antler

Pixel-art portfolio of Michał Kulijewicz, Writer. Built for a Larian Studios application.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build
```

- Copy: `src/content/copy.ts` (dialogue, UI strings, contact) and `src/content/documents.ts` (CV and letter, currently placeholders).
- Positions in the scene: `src/world/layout.ts`.
- Re-export art after editing `/sprites`: `npm run assets`.
- Replay the intro: "Begin anew" (top right) or clear the site's local storage.

## Deploy (Vercel)

Import the repo in Vercel. The Vite preset is detected automatically (build `npm run build`, output `dist`). `vercel.json` sets long cache headers for hashed assets.
````

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: README with develop and deploy notes"
```

- [ ] **Step 5: Hand off deployment to the user**

Deploying is outward-facing. Don't run `vercel` yourself. Tell the user the build is ready, and that they can deploy by importing the repo in Vercel, or with `npx vercel --prod` after `npx vercel login`.
