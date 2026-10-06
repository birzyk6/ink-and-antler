# Gameplay — how the player traverses the portfolio

## Core loop (one sentence)
Title sign lights up → druid walks in and greets → click the glowing NPC → pick a
dialogue option → receive an item → open the satchel → read it.

## World layout — one static scene, no scrolling

The whole town (`sprites/bg/bg.png`, 16:9) is one fixed screen, like a point-and-click
scene. No page scroll, no parallax, no camera moves. Things move *inside* the scene
(NPCs, fire, smoke, clouds) and the player clicks on them.

```
 ┌───────────────────────────────────────────────┐
 │ 🔥[ TAVERN SIGN — title ]🔥      [skip] [♪]   │  sky band (y 0–250)
 │        clouds drift slowly  ·  castle          │
 │                                                │
 │ forge · bakery · cloth · veg · house           │  UPPER STREET (y≈600/1080)
 │ ════════ Haslin the Druid patrols ════════     │                        [🎒]
 │                                                │  satchel, right edge
 │ fish · potions · veg · lanterns · pottery      │  LOWER STREET (y≈950/1080)
 │           (set dressing only in POC)           │
 │  [cat] (fast travel)                           │  contact: email / LinkedIn
 └───────────────────────────────────────────────┘
```

- `100vw × 100vh`, `overflow: hidden`. The stage is a 16:9 world scaled to **cover** the
  viewport (a little cropped at the edges, no bars). Important things stay in a central
  "safe area" so they are never cropped.
- All positions are in world pixels, so NPCs and hotspots line up at any screen size.
- Clickable hotspots: Haslin, the cat (pet it; after both scrolls it offers fast travel to contact),
  the title sign (small swing).

## NPC behaviour (Haslin)

State machine:

```
ENTER (walk from left edge → centre)
  → GREET (idle, bubble lines, "!" marker)
  → WAIT_FOR_CLICK ──6s──> nudge bark
  → DIALOGUE (frozen, facing player)
  → GIVE_ITEM
  → PATROL: pick waypoint on upper street → WALK → IDLE 2–5s → repeat
```

- Frames: `walk1–4` at ~8 fps, `idle1–2` at ~2 fps (breathing/owl blink).
- Facing: sprite faces right; mirror with `scaleX(-1)` when walking left.
- Walk speed constant in world px/s; bounds = upper street x-range, avoiding stall fronts.
- ENTER starts right after the title sign's torches light (~1.5s after load), so the
  player sees the sign first and the druid second.

## UI elements (all pixel-art, in-world)

| Element | Where | Behaviour |
|---|---|---|
| **Speech bubble** | Above NPC, follows him | 9-slice pixel bubble, typewriter text (~40 chars/s), click to finish/advance, tail points at speaker |
| **`!` quest marker** | Above NPC head | Gold, bobbing; turns grey `…` after item given |
| **Tooltip / hint** | Near target | Parchment tag with pixel cursor icon; auto-dismiss after action |
| **Dialogue panel** | Bottom, slides up | Wooden frame, NPC portrait left, numbered choices (keys 1–4 work), skill-check choices tagged `[PERSUASION]` in gold |
| **d20 roll** | Centre overlay | Pixel die tumbles ~1s, lands; result + "Success" banner |
| **Satchel button** | Right edge, vertically centred, fixed | Leather bag icon; wiggle + gold badge on new item; `I` key toggles |
| **Inventory panel** | Slides in from right | 4×3 slot grid; empty slots dim; hover → item card (name, rarity colour, flavour, weight) |
| **Scroll viewer** | Full-screen modal | Scroll unrolls vertically (rod top/bottom); parchment body; handwritten CV; buttons "Roll it up" / "Take a copy (PDF)" |
| **Toast** | Top centre | "X added to your satchel" |
| **Quest log** (optional) | Top-left, small | "The Chronicle of Michał" — ☐ Scroll ☐ Letter; ticks as items collected |
| **Sound toggle** | Top-right | Muted by default; lute loop + text blips + coin sfx |
| **Skip button** | Top-right, always visible | "Skip the tale →" opens CV directly (recruiter-friendly) |

## Persistence
- Inventory + dialogue-seen flags stored in `localStorage` (wrapped in try/catch).
- Returning visitor: Haslin is already patrolling, scroll already in satchel, no intro replay.
- "Reset tale" option in the sound/settings corner.

## Ambient animation list (cheap wins)
- Forge fire flicker (2–3 frame overlay on the forge mouth)
- Chimney smoke particles (bakery, forge)
- Clouds drifting (CSS translate loop)
- Cat tail flick / stretch
- Hanging lanterns sway (lower street)
- Fluttering cloth banners at the cloth stall
- Occasional bird crossing the sky

## Title — hanging tavern sign with torches (chosen)

**Sprite:** a carved oak board (about 200×70 world px) hanging on two iron chains from a
wrought-iron bracket that comes in from the top edge. A torch in an iron sconce sits at
each end of the bracket. There's a gilded blackletter name line (Jacquard 24, gold with a
dark outline), a smaller subtitle line, and a small carved emblem (a quill crossed with a
branch, a nod to the druid).

**Intro (≈1.5s):**
1. The scene fades in at dusk tint, with the sign dark.
2. The left torch sparks and lights, then the right one (fire loops of 3–4 frames).
3. The warm light spreads onto the board and the gold letters catch it (a shimmer
   sweeps once).
4. The sign swings once and settles. Chains creak (if sound is on).
5. The dusk tint lifts to day, and Haslin enters.

Idle: the torches flicker, and the sign sways slightly every ~8s. Click it: it swings and
gives a bark ("Careful. That sign has been hanging longer than most kings.").

**Sign text (chosen):**
> **The Ink & Antler**
> *Home of Michał Kulijewicz, Writer*

The name line is in Jacquard 24, gold. The subtitle is in a smaller cream pixel font. The text is
drawn into the sprite and is also real DOM text (visually hidden, as the page `<h1>`) for
SEO and screen readers. Check that the `ł` glyph renders in both fonts. If a font we like has no `ł`, write **Michal** with a plain `l` in that font rather than change fonts. Keep all name strings in `/src/content` so the swap is one line.

## Accessibility & recruiter safety
- `Skip the tale` + the cat's fast travel; real PDF downloads for both scrolls.
- All dialogue is real DOM text (selectable, screen-reader friendly), not baked into images.
- `prefers-reduced-motion`: instant text, no d20 tumble, no sign swing.
- Keyboard: Tab to NPC, Enter to talk, 1–4 choices, `I` satchel, Esc closes.
- Mobile portrait: the scene is too wide, so show a "turn your device" parchment card,
  with a "read the scroll anyway" link to the CV.

## v1 POC scope
In: full town scene, tavern sign + torch intro, Haslin (enter / greet / origin / wager / checks /
rigged nat 20 / five-dice game / patrol), satchel, inventory, scroll + letter viewers with
real CV and letter, cat fast travel, skip button, localStorage.
Out (later): extra NPCs, sound, quest log, lower-street ambient, real handwritten CV art.
