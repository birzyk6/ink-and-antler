# Dice Game — "Antler & Bone"

> Draft idea. It replaces "druid sells you the CV". Now the druid **wagers** the CV and the
> motivational letter, and you win them at dice. Dialogue choices and ability checks
> (d20 + modifier vs DC) bend the odds.

## Pitch
Ossian's stall has two items on display: the **Scroll of Curriculum Vitae** and the
**Sealed Letter of Motivation**. Both are chained shut with a small padlock icon. He won't sell them.

> OSSIAN: "Sell them? Coin is dull. Chance has manners. Sit, traveller — we'll let the bones decide."

Win a round and you unlock one item of your choice. Win again and you unlock the other.
**You can never get locked out.** Losing gives a funny line and a rematch, and after two
losses in a row Pim steps in and you win anyway.

## Flow

```
Druid walks in → greets → [click]
  → ORIGIN ("Who approaches?")  — sets your modifiers
  → WAGER ("Which prize do you play for?")  CV | Letter
  → PRE-GAME CHECK (pick one ability check)
       NAT 20 (≈45%) → "Lucky Twenty": he sells you BOTH, dice game skipped → epilogue
       otherwise ↓
  → DICE ROUND
       win  → prize unlocks → flies to satchel
       lose → rematch (with a pity bonus) → 2nd loss → Pim intervenes → win
  → second prize? → WAGER again (origin is remembered)
  → both won → epilogue, signpost glows (contact)
```

A full run takes about 90 seconds. `Skip the tale` still opens both documents at once.

## 1. Origin — "Who approaches?"
Chosen once and saved. It gives +3 to one ability, and Ossian reacts.

| Choice | Bonus | Ossian |
|---|---|---|
| "A recruiter, from a studio in Ghent." | **CHA +3** | "Ghent! Pim — the good dice. The ones without the dent." |
| "A scholar. I read the fine print." | **INT +3** | "Then you'll enjoy these dice. They have *very* fine print." |
| "Nobody. Just passing through." *(winks)* | **DEX +3** | "Nobody has quick fingers. Keep them where Pim can see them." |
| "An old friend of the forest." | **WIS +3** | "Pim doesn't remember you. Pim remembers everyone. Interesting." |

All other abilities are +0.

## 2. Pre-game checks (pick one per round, each check usable once)
Shown as dialogue choices with a coloured tag. d20 + modifier vs DC, with the full roll animation.

| Choice | Check | Success | Failure |
|---|---|---|---|
| "Surely a guest rolls first. And twice?" | **[CHA · Persuasion] DC 12** | +1 extra reroll | "A guest, yes. A fool, no." (no effect) |
| "Let me take a look at those dice." | **[INT · Investigation] DC 14** | You find his loaded die. He swaps it, embarrassed, and you get +1 to one die | "They're dice. They have dots. Well spotted." |
| *Palm a die of your own.* | **[DEX · Sleight of Hand] DC 15** | Set one of your dice to 6 | Pim screeches. "Pim saw that. Pim respects it. Pim is also telling everyone." Ossian gets +1 reroll |
| "Watch his eyes as he rolls." | **[WIS · Insight] DC 10** | His dice are shown before you reroll | "He blinks a lot. Then again, he's a druid." |
| *Offer Pim a crumb of bread.* | **[WIS · Animal Handling] DC 8** | Pim takes your side: ties go to you | Pim eats the crumb and gives nothing back. "Classic Pim." |

- **Natural 20:** see "Lucky Twenty" below. It beats everything.
- **Natural 1:** the check fails with a special line, but there is never a penalty worse than the table above.

## 2b. Lucky Twenty (rigged on purpose)
The d20 is **weighted**: every check has about a **45% chance of a natural 20** (the other
results are spread across 1–19). Most players see it in their first or second check.
It feels lucky, not free.

**On a natural 20, whichever check it was:**
1. The die freezes mid-air for a moment and glows gold, with a screen flash and a "NATURAL 20" banner.
2. Pim applauds. (He has never applauded.)
3. Both chains break at the same time, and the CV and letter fly into the satchel one after the other.

> OSSIAN: "…Twenty. *Twenty.* Pim, did you sell them the good die again?"
>
> OSSIAN: "Fine. Fine! Take both. The scroll *and* the letter. A roll like that deserves the whole chronicle."
>
> OSSIAN: "I'd challenge you to dice, but I've a strong feeling I'd lose. I'm a druid. I have feelings about these things."

Then comes the epilogue (section 5). Knucklebones is skipped, but it stays available by
clicking Ossian again ("One game for honour? No prizes. Pim keeps score."). You can play
it just for fun.

**Rules:**
- The weighting applies to every d20 check. The pity system (section 3) still covers
  unlucky players, so everyone gets both documents in the end.
- If the first nat 20 happens on the **second** wager (the player already won one item),
  the line is: "Twenty! Take the other one too — I mean, it's the only one left, but take it *triumphantly*."
- `prefers-reduced-motion`: no freeze or flash, just the banner and the text.

## 3. The dice round — "Knucklebones"
Simple enough to learn in 5 seconds, with one real choice so it feels like a game.

1. Ossian rolls **3d6** first (his dice are hidden unless you passed Insight).
2. You roll **3d6**.
3. **Once:** click any of your dice to hold them, then reroll the rest (plus any extra rerolls you earned).
4. Reveal and compare hands:

| Hand | Example | Rank |
|---|---|---|
| **Triple** | ⚅⚅⚅ | 1st place |
| **Run** | ⚀⚁⚂ / ⚃⚄⚅ | 2nd place |
| **Pair** | ⚂⚂⚄ | 3rd place (higher pair wins) |
| **Sum** | ⚀⚂⚅ | Highest total wins |

Ties go to Ossian, unless Pim is on your side.

**Ossian's play:** he holds pairs and triples and rerolls everything else. It's fair, not rigged.

**Pity system:**
- After your 1st loss: "Again. The bones were still waking up." You get +1 free reroll in the rematch.
- After your 2nd loss: Pim flaps onto the table and knocks over a die in your favour. "…Pim has overruled me. Pim is the senior partner." You win.

**Lines:**
- You win: "The bones have spoken. They said *your name*, which is rude of them."
- You lose: "The bones have spoken. They said 'no'. They often do."
- Triple for you: "Three of a kind! Pim, write this down. Pim can't write. Remember it, then."

## 4. Unlocking
- The prize's chain breaks (a 3-frame shatter), the item arcs to the satchel, and a toast appears.
- **CV:** in the satchel it's a rolled scroll. Opening it unrolls the parchment.
- **Letter:** in the satchel it's a letter with a wax seal. The first time you open it, the seal cracks,
  the letter unfolds, and a line appears: "Warm to the touch. Someone meant every word."
- Items you've won are saved (localStorage). A returning visitor skips straight to the unlocked state.

## 5. Epilogue (both won)
> OSSIAN: "Two for two. Pim, we've been hustled."
>
> OSSIAN: "If you're done reading, the signpost by the stairs knows how to reach Michał. Pim does not endorse visiting."

The signpost gets a `!` marker. From then on, clicking Ossian gives rotating barks.

## New UI / sprites needed
- **Dice tray**: a wooden tray (felt inside) that slides up in the dialogue panel, with 6 dice positions
- **d6 sprite sheet**: 6 faces + 4 tumble frames, plus "held" state (gold outline)
- **d20 sprite**: tumble frames + a number overlay (the number is DOM text on top)
- **Check tag chips**: CHA / INT / DEX / WIS, each with a colour and small icon
- **Chain + padlock** overlay on the stall items, and a shatter animation
- **Wax seal** crack animation for the letter
- **Pim on the table**: a flap/knock-over animation (2–3 frames, can reuse the owl crop from the druid)

## Decisions
- One merchant only (Ossian holds both prizes). No Scribe in the POC.
- The Origin choice stays.
- Free choice of which prize to play for first.
