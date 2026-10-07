# Script v2 adjustments - design

Source: Michał's script v2 + rule changes (2026-10-06). Real CV and motivational letter PDFs supplied.

## 1. Cast and copy (`src/content/copy.ts`)

- Ossian → **Haslin**, Pim → **Erl**. The word "bones" is removed from every string ("dice" instead).
- Lines are taken verbatim from the script:
  - Greeting: "Welcome, traveller. You must be here, searching for the legendary scrolls… Am I right?" / "How do I know? Nature has its ways, traveller."
  - Nudge: "Erl says you shan't be shy. Just click."
  - Origin prompt: "Before we get to business, my name is Haslin, yes, related to Halsin. And yes, also a druid. Who stands before me?"
  - Origins (label → reply, tag):
    - CHA +3 - minstrel line → "Ahhh, a poet. Erl, fetch the dice. The ones Volo gifted us. We shall play."
    - INT +3 - scholar line → "Your pursuit is commendable, but nature is of fickle, well… nature. Thus you shall put your fate in dice."
    - DEX +3 - "A crook." → "And definitely not level one. Erl, dice."
    - WIS +3 - "Halins, yes, related to Halsin." → "Ha! A small world, I never got along with your side of the family. Blood or not, we shall play either way."
  - Wager: "Two ancient scrolls. Both worth a small fortune, and if it smiles at you, you can have them. What will be our first wager?" Choices: "The scroll." (CV) / "The other scroll." (letter). No "What's on them?", no "Not today" (Esc still closes).
  - Check prompt "Shall we?"; tricks Persuasion / Investigation / Sleight of Hand / Animal Handling with script success/failure lines; decline "Just roll the dice." Insight is removed.
  - Natural 1 narration: "Erl cocks his head, blinks. His screeches… a chuckle?"
  - Win: "The dice rarely lie. Enjoy the read, traveller."
  - Tie resolved by Erl: "A tie!… excuse me?! … well… Erl, ekhm… the rule of hospitality commend us, to deem this a victory of the guest… you, that is."
  - Loss: "You know what a druid says after a game of dice? It's dicided, I win!" then rematch offer "The dice seem fond of you. Shall we play another round?" with choice "Again."
  - Prize: "The Scroll of Curriculum Vitae is yours." / "The Scroll of Motivational Letter is yours."
  - One left: "One treasure remains. Same terms. Shall we?"
  - Epilogue: "Both scrolls are now yours, traveller. I trust you will find a great use for the power stored within them." / "When you are done here, the cat in the lower section of the city should know how to reach the scribe." / "Farewell, traveller."
  - Barks (each spoken once, never repeated): "You already got the scrolls. No, I'm not betting Erl." / "I have a one-on-one scry in 15 minutes, go and read your scrolls."
- New lines (drafted, approved):
  - Tie without Erl: "A tie! The dice can't decide. Again, then."
  - Double or nothing: "Double or nothing, traveller. The other scroll against the one in your satchel."
  - Cat: "Mrrrow."
- Items: **Scroll of Curriculum Vitae** (Legendary), **Scroll of Motivational Letter** (Rare). Flavour text kept.
- No reactions to hand types (triple line removed). The dice tray still names each hand.

## 2. Dice game (`src/game/dice.ts`, `src/game/round.ts`)

- **5 dice** per side.
- Ranks, high to low: five of a kind, four of a kind, full house, straight (1–5 or 2–6), three of a kind, two pairs, pair, only the sum.
- Within a rank, compare the rank's faces (high first), then the total sum. Equal → **tie**. `compareHands` returns `'win' | 'lose' | 'tie'`.
- Ties: if Animal Handling passed this game, the player wins with the Erl tie line. Otherwise the game is replayed (same wager, not counted as a loss) after the tie-without-Erl line.
- **Rerolls are per game**: 1 base, +1 if Persuasion passed for this game. Nothing carries over; the old pity reroll is removed.
- Tricks are offered fresh before every game (each game may use one trick or decline).
- Silent pity: after two losses in a row the next game is rigged to win; the normal win line plays.
- Haslin rerolls once: on five of a kind, full house or straight he keeps all dice; otherwise he keeps every die whose face appears two or more times and rerolls the rest (on only the sum he rerolls all five).
- Trick effects: Persuasion +1 reroll; Investigation +1 to your lowest die at reveal; Sleight success sets your lowest die to 6, failure gives Haslin one extra reroll; Animal Handling: ties go to you.
- Tray buttons: **Reroll** and **Reveal**.

## 3. Natural 20

- A natural 20 on a trick check counts as a success (effect applies) and **rigs the next game**: the player's opening roll is resampled until it beats Haslin's hand, and each reroll is resampled (held dice kept) until it still wins; if no winning sample is found within a bound, the result is forced to a win.
- After that win and its prize line, if a scroll remains: double-or-nothing line, then a second rigged game starts directly (no trick prompt). Win → prize → epilogue.
- The old instant "Lucky Twenty" grant is removed. The nat-20 celebration effect stays.

## 4. Flow

- After the first prize: "One treasure remains. Same terms. Shall we?" goes straight to the trick prompt for the remaining scroll.
- **Druid clickable while entering**: he stops where he stands, greeting is skipped, dialogue opens.
- **Rewind** button in the dialogue panel steps back one choice beat (origin ↔ wager ↔ trick prompt). History is cleared when a d20 is rolled or a game is revealed, so rolls and results cannot be undone. Hidden when there is nothing to rewind.
- Dialogue showing several lines puts a blank line between them.
- After both scrolls, clicking Haslin plays the next unused bark; when all are used, clicking does nothing.

## 5. Cat replaces signpost

- Signpost sprite, hotspot and `SIGNPOST` layout constant removed.
- Cat hotspot over the painted cat (world ≈ x 340, feet y 965). Click: "Mrrrow." bubble and a floating heart (the cat is painted into the background, so it cannot hop). Keyboard accessible.
- After both scrolls are won and before the fast-travel menu has been opened once, the cat shows the `!` marker. After both scrolls, clicking the cat also opens **Fast Travel**:
  - Postal Office (kulijewiczmichal@gmail.com) → `mailto:`
  - Guild Hall (LinkedIn) - the word "LinkedIn" is the link to https://www.linkedin.com/in/varmblixt
- Persisted `contactSeen` keeps its meaning (fast travel opened at least once).

## 6. Satchel (BG3-style)

- Satchel panel has a fixed width and height. The item card has a fixed height that fits the longest description, so the panel never resizes on hover.
- Scroll icons are hand-built SVG: rolled parchment with shading, a ribbon, a wax seal; CV and letter differ in ribbon/seal colour. Slots are dark bevelled squares with a rarity-coloured glow.
- Tooltip card: name in rarity colour, "Scroll · <rarity>", flavour, weight.

## 7. Documents

- `src/content/documents.ts` holds the real CV (contact, skills, experience, education, interests, closing line) and the real letter (opening, poem stanzas with line breaks, closing paragraphs, sign-off).
- Both open in the scroll viewer. The letter's wax seal cracks on first open.
- PDFs copied to `public/` (`michal-kulijewicz-cv.pdf`, `michal-kulijewicz-letter.pdf`); both viewers offer "Take a copy (PDF)".
- `CONTACT.email` = kulijewiczmichal@gmail.com, `CONTACT.linkedin` = https://www.linkedin.com/in/varmblixt.
- `docs/story.md` and `docs/dice-game.md` rewritten to match v2.

## 8. Testing

- Unit: 5-dice hand evaluation and comparison (incl. sum ties and equal hands), Haslin holds, rigged rounds always win, per-game rerolls, tie handling.
- Store: nat-20 → rigged win → double or nothing → second rigged win → epilogue; tie replay; tie with Erl; rewind and history clearing; barks once; click while entering; pity.
- Component: dialogue line spacing, satchel fixed size, cat/fast-travel links. `npm test` and `npm run build` pass; manual run in the browser.
