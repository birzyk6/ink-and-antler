# Stack

## Decision: Vite + React + TypeScript, PixiJS 8 for the scene, GSAP for motion

Two layers:
- **PixiJS 8 canvas** (bottom) draws the world: background, druid, tavern sign, torches, signpost,
  **particles** (sparks, embers, smoke, the gold nat-20 burst) and **filters** (dusk colour matrix,
  gold glow on the sign, bloom flash on a natural 20). It has no input handling.
- **React DOM** (top) holds everything textual or interactive: speech bubbles, click targets, dialogue,
  dice, satchel, scroll/letter viewers. It is accessible, keyboard-friendly and unit-testable.
- The scene moves DOM "anchors" over the druid and signpost every tick, so bubbles stick to them.
- **GSAP** animates both layers: the intro timeline, sign swing, panel/choice entrances,
  the fly-to-satchel arc, the scroll unroll and the seal crack.
- **zustand** is the only bridge: React and the scene both read and write the same store.

| Option | Size (gz) | Why not / why |
|---|---|---|
| **PixiJS 8 + GSAP** ✅ | ~200–250 KB | Best-in-class 2D renderer, particles + filters, and it sits cleanly under a React UI |
| Phaser 3 + Motion | ~400 KB | A full engine whose scene system fights React; heavier |
| Kaplay + GSAP | ~150 KB | Weaker particles/filters |

## Libraries
- **react / react-dom**, **vite**, **typescript**
- **pixi.js** 8, **pixi-filters** 6 (GlowFilter, AdvancedBloomFilter)
- **gsap** + **@gsap/react** (`useGSAP`)
- **zustand** (+ persist): game state, inventory, flags, dialogue node
- Fonts (Google Fonts, `display=swap`): **Jacquard 24** (titles), **Pixelify Sans** (UI & dialogue),
  **IM Fell English** (handwritten documents)
- Dev only: **sharp** (asset pipeline), **vitest** + Testing Library + jsdom

## Rendering pixel art crisply
- World = fixed 1920×1080 container scaled to cover the viewport (at most 20%/15% crop, then letterbox).
- Pixel-map sprites are baked to textures with `scaleMode = 'nearest'`, and the canvas has `antialias: false`.
- The druid is a 6-frame strip; frames are swapped by the patrol state machine.

## Asset pipeline (important for weight)
1. The source art is anti-aliased and not on a clean pixel grid, so it is downscaled with lanczos (nearest-neighbour would add jaggies).
2. `bg.png` → `src/assets/bg.webp` at 1920×1080, quality 80 (about 300 KB).
3. Druid frames are cropped to their shared box (97,33 → 323×447), scaled to 162×224 and packed into `src/assets/druid.webp` (6 frames: idle1, idle2, walk1–4).
4. Generated assets are committed, so Vercel doesn't need sharp. Re-run with `npm run assets`.

## Budget
- JS < 260 KB gz, total first load < 1.2 MB, LCP < 2.5 s on 4G.
- Lazy-load the scroll viewer + CV image; preload only the bg, druid sheet, fonts.

## Project layout
```
/sprites            source art (as delivered)
/scripts            build-assets.mjs (sharp)
/src
  /assets           generated bg.webp, druid.webp (committed)
  /content          ALL copy: copy.ts, documents.ts
  /game             pure rules + store: dice, round, checks, d20, items, store
  /pixel            pixel maps, palettes, <PixelArt/> SVG renderer
  /scene            Pixi only: createScene, SceneCanvas, titleSign, intro, particles, ambient, fx hooks
  /npc              patrol state machine, druid sheet constants, DruidOverlay + speech
  /dialogue         DialoguePanel, D20, dice tray, portrait
  /ui               satchel, receive fx, viewers, bubbles, hints, splash, top bar, contact, portrait gate
  /world            layout constants, stage transform, signpost hotspot
```
Implementation plan: `docs/superpowers/plans/2026-09-28-ink-and-antler-poc.md`.

## Hosting
- Vercel, static build (`vite build` → `dist`), no server.
- Long cache headers for hashed assets (`vercel.json`).
- Optional: `@vercel/analytics` (tiny) to see if the recruiter opened the scroll.

## Sprites I can produce (as code-generated pixel art, PNG via script or inline SVG)
- Title (see gameplay.md options), speech-bubble 9-slice, dialogue frame, satchel icon,
  inventory slot, scroll item icon, unrolling scroll rods + parchment, d20 die frames,
  `!` marker, cursor/hint icon, cloud sprites, smoke puffs, fire flicker overlay.
- Style-match to the existing art: warm browns, gold accents, dark outline.
