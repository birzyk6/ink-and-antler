# Story — "The Ink & Antler"

> Portfolio of **Michał Kulijewicz**, applying for a **Writer** position at Larian Studios.
> The site itself is the writing sample: every line of dialogue, item description and
> tooltip should show voice, wit and restraint. Short lines, strong flavour.

## Premise

The player is a traveller who arrives at a market town at dawn. Above the street hangs the
sign of **The Ink & Antler**, *Home of Michał Kulijewicz, Writer*. The writer's chronicle is
in the keeping of one merchant:

- **Ossian the Druid** (upper street) keeps both the **Scroll of Curriculum Vitae** and the
  **Sealed Letter of Motivation**. They sit chained on his stall. He doesn't sell them. He wagers them.
- His owl, **Pim**, is the real negotiator, the senior partner, and silently judges everyone.

POC scope: **one NPC (Ossian)**, since he is the only sprite we have. The lower street is
set dressing only.

Tone: warm, dry, a little self-aware. The world takes itself seriously and the characters
don't always. It's a homage to Larian (d20 checks, dialogue choices, item cards), with no
direct BG3/Divinity IP.

## Script

Stage directions are in *italics*. Mechanics are in `dice-game.md`.

### Scene 0 — Loading (≤1s)
*Black screen. A pixel d20 spins and lands on 20.*
> "Rolling for initiative…"

### Scene 1 — The Sign Lights
*The whole town sits on one screen at dusk, quiet. The tavern sign hangs dark from its
bracket in the sky. The left torch sparks, then the right. The gold letters catch the light:*

> **The Ink & Antler**
> *Home of Michał Kulijewicz, Writer*

*The sign swings once, and dusk lifts to morning.*

### Scene 2 — The Druid Arrives
*The town wakes: forge fire flickers, chimney smoke rises, the cat stretches. Ossian walks in
from the **left edge** along the upper street, stops at the centre and turns to the viewer.
Pim blinks.*

> OSSIAN: "Hail, traveller. You have the look of someone searching for a writer."
>
> OSSIAN: "Fortunately, I have the look of someone guarding one."

*A gold `!` pulses above his head. A tooltip appears:* 🖱 *Click the druid to speak.*
*(If ignored for ~6s, he adds: "Pim says you're allowed to click. Pim is rarely wrong.")*

### Scene 3 — Who Approaches?
*Click, and the dialogue panel slides up with his portrait on the left and numbered choices.*

> OSSIAN: "Before we trade words — who approaches?"

1. "A recruiter, from a studio in Ghent." → **CHA +3**
   > "Ghent! Pim — the good dice. The ones without the dent."
2. "A scholar. I read the fine print." → **INT +3**
   > "Then you'll enjoy these dice. They have *very* fine print."
3. "Nobody. Just passing through." → **DEX +3**
   > "Nobody has quick fingers. Keep them where Pim can see them."
4. "An old friend of the forest." → **WIS +3**
   > "Pim doesn't remember you. Pim remembers everyone. Interesting."

### Scene 4 — The Wager
> OSSIAN: "Two treasures. The deeds of Michał Kulijewicz, written in a steady hand — and a letter,
> sealed, that explains *why*. Sell them? Coin is dull. Chance has manners."
>
> OSSIAN: "Which will you play for?"

1. "The scroll." *(CV)*
2. "The letter." *(motivational letter)*
3. "What's on them?"
   > "The scroll: where Michał has been, what's been written, which quests were survived.
   > The letter: the part that can't fit on a scroll. Pim has read both. Pim wept. Pim denies this."
4. "Not today." *(closes; he goes back to wandering and the `!` stays)*

### Scene 5 — The Check
*Before the round he leans in. The player picks one ability check (the table is in
`dice-game.md`). The d20 tumbles.*

**Natural 20 (≈45%): Lucky Twenty.**
> OSSIAN: "…Twenty. *Twenty.* Pim, did you sell them the good die again?"
>
> OSSIAN: "Fine. Fine! Take both. The scroll *and* the letter. A roll like that deserves the whole chronicle."

*Both chains shatter and both items fly into the satchel. Skip to Scene 7.*

**Anything else:** the check succeeds or fails and bends the odds → Scene 6.

### Scene 6 — Knucklebones
*A dice tray slides up and the round is played (see `dice-game.md`).*
- **Win:** "The bones have spoken. They said *your name*, which is rude of them." → the item unlocks → back to Scene 4 for the other one.
- **Lose:** "The bones have spoken. They said 'no'. They often do." → rematch with +1 reroll.
- **Second loss:** *Pim flaps onto the table and knocks a die over.* "…Pim has overruled me. Pim is the senior partner." → you win.

### Scene 7 — Item Received
*The item arcs from the stall into the satchel on the right edge. The satchel wiggles and gets a gold badge.*
> Toast: **"Scroll of Curriculum Vitae"** added to your satchel.
> Tooltip on satchel: *Open your satchel to read it.*

> OSSIAN: "Read it somewhere dry. The ink runs when people cry at the good parts."

### Scene 8 — Reading
*The satchel opens as a slot grid. Hover shows an item card. Click the scroll and it unrolls full-screen
(handwritten CV, placeholder in the POC). Click the letter and the wax seal cracks, then the letter unfolds.*

### Scene 9 — Epilogue (both items won)
> OSSIAN: "Two for two. Pim, we've been hustled."
>
> OSSIAN: "When you're done reading, the signpost by the stairs knows how to reach Michał.
> Pim does not endorse visiting. Pim does not endorse anything."

*The signpost gets a `!` and holds the contact links. Ossian patrols the upper street. Clicking him
again gives rotating barks, plus "One game for honour? No prizes. Pim keeps score."*
- "Already lost the best things I own. The owl is not for sale."
- "Michał once described a sunset so well the sun came back to listen."
- "If Ghent sends a cart, tell them Pim travels free."

## Item flavour text

| Item | Rarity | Flavour |
|---|---|---|
| Scroll of Curriculum Vitae | Legendary | *"Contains one (1) writer. Handle with interest."* Weight 0.1 |
| Sealed Letter of Motivation | Rare | *"Warm to the touch. Someone meant every word."* Weight 0.05 |

## Writing rules for all copy
- Max ~2 lines per bubble; the player should never wait for text.
- Every UI string is in-world: not "Close" but "Roll it up", not "Cancel" but "Farewell".
- One joke per exchange, max. Sincerity lands harder after a laugh.
- A plain-language fallback is always near (`Skip the tale →` for recruiters in a hurry).
