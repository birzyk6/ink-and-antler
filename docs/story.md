# Story — "The Ink & Antler" (script v2)

> Portfolio of **Michał Kulijewicz**, applying for a **Writer** position at Larian Studios.
> The site itself is the writing sample. All player-facing strings live in `src/content/copy.ts`.

## Characters
- **HASLIN**, a druid who runs a dice table ("yes, related to Halsin").
- **Erl**, his owl, the senior partner.
- **TRAVELLER**, the player.

## Scene 1 — The Greeting
Haslin walks in from the left. He can be clicked at any point, even before he stops.
> HASLIN: Welcome, traveller. You must be here, searching for the legendary scrolls… Am I right?
> HASLIN: How do I know? Nature has its ways, traveller.
> *(nudge)* HASLIN: Erl says you shan't be shy. Just click.

## Scene 2 — Who approaches?
> HASLIN: Before we get to business, my name is Haslin, yes, related to Halsin. And yes, also a druid. Who stands before me?

| Traveller | Bonus | Haslin |
|---|---|---|
| I'm a minstrel, from a land of wonders… | CHA +3 | Ahhh, a poet. Erl, fetch the dice. The ones Volo gifted us. We shall play. |
| A scholar. My hunger for knowledge knows no bounds… | INT +3 | Your pursuit is commendable, but nature is of fickle, well… nature. Thus you shall put your fate in dice. |
| A crook. | DEX +3 | And definitely not level one. Erl, dice. |
| Halins, yes, related to Halsin. | WIS +3 | Ha! A small world, I never got along with your side of the family. Blood or not, we shall play either way. |

## Scene 3 — The wager
> HASLIN: Two ancient scrolls. Both worth a small fortune, and if it smiles at you, you can have them. What will be our first wager?

Choices: "The scroll." (CV) / "The other scroll." (motivational letter).

## Scene 4 — Tipping the odds
> HASLIN: Shall we?

One trick per game, or "Just roll the dice." Lines and effects: see `dice-game.md`.

## Scene 5 — The roll
- Natural 1 (any trick): *Erl cocks his head, blinks. His screeches… a chuckle?*
- Win: "The dice rarely lie. Enjoy the read, traveller."
- Tie, Erl on your side: "A tie!… excuse me?! … well… Erl, ekhm… the rule of hospitality commend us, to deem this a victory of the guest… you, that is."
- Tie otherwise: "A tie! The dice can't decide. Again, then." → the game is replayed.
- Loss: "You know what a druid says after a game of dice? It's dicided, I win!" then "The dice seem fond of you. Shall we play another round?" → "Again."
- No reactions to specific hands.

**Natural 20** on a trick: the trick succeeds and the next game is rigged — the traveller is dealt a winning hand. If both scrolls were on the table, Haslin then says "Double or nothing, traveller. The other scroll against the one in your satchel." and loses that game too.

## Scene 6 — The Prize
- "The Scroll of Curriculum Vitae is yours." / "The Scroll of Motivational Letter is yours."
- One left: "One treasure remains. Same terms. Shall we?"

## Scene 7 — Epilogue
> HASLIN: Both scrolls are now yours, traveller. I trust you will find a great use for the power stored within them.
> HASLIN: When you are done here, the cat in the lower section of the city should know how to reach the scribe.
> HASLIN: Farewell, traveller.

**Idle barks** (on click, each spoken once, never repeated):
- "You already got the scrolls. No, I'm not betting Erl."
- "I have a one-on-one scry in 15 minutes, go and read your scrolls."

## The cat (fast travel)
Clicking the cat on the lower street: "Mrrrow." and a heart. After both scrolls it shows `!` and opens **Fast Travel to:**
- Postal Office (kulijewiczmichal@gmail.com)
- Guild Hall ([LinkedIn](https://www.linkedin.com/in/varmblixt))

## Items
| Item | Rarity | Flavour |
|---|---|---|
| Scroll of Curriculum Vitae | Legendary | "Contains one (1) writer. Handle with interest." Weight 0.1 |
| Scroll of Motivational Letter | Rare | "Warm to the touch. Someone meant every word." Weight 0.05 |

Real text comes from the CV and letter PDFs (`src/content/documents.ts`); both PDFs are downloadable from `public/`.

## UI rules
- Every UI string is in-world. The dice are never called "bones".
- Several lines in one dialogue box are separated by a blank line.
- "Rewind" steps back one choice (origin ↔ wager ↔ tricks) until a die is rolled.
