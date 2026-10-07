# Dice Game (script v2)

Haslin wagers two scrolls. Win a game, win a scroll. You can never get locked out.

## Flow
```
click Haslin (any time, even mid-entrance)
  → ORIGIN (+3 to one ability, once)
  → WAGER: "The scroll." | "The other scroll."
  → TRICKS: one per game, or "Just roll the dice."
  → GAME (5 dice each)
       win  → scroll to satchel → one left? "One treasure remains…" → TRICKS
       tie  → Erl on your side? win : replay the same game
       lose → "Again." → TRICKS (fresh)
  → both won → epilogue → cat offers fast travel
```

## Tricks (d20 + modifier vs DC)
| Trick | Check | DC | Success | Failure |
|---|---|---|---|---|
| "Surely a guest rolls first. And twice?" | CHA · Persuasion | 12 | +1 reroll this game | |
| "Let me take a look at those dice." | INT · Investigation | 14 | +1 to your lowest die at the reveal | |
| "Do the old switcheroo." | DEX · Sleight of Hand | 15 | your lowest die becomes a 6 | Haslin rerolls once more |
| "Offer Erl a Rivellon Fry." | WIS · Animal Handling | 8 | ties go to you (Erl resolves them) | |

The d20 is weighted: ~45% natural 20. A natural 20 always succeeds **and rigs the next game** (you are dealt a winning hand; rerolls keep it winning). With both scrolls still on the table, Haslin then offers double or nothing for the other scroll, and loses that rigged game too.

## The game
- Both sides roll **5 dice**. Haslin's stay hidden until the reveal.
- Haslin rerolls once: he keeps five of a kind, full house and straight whole; otherwise he keeps every face that appears twice or more.
- You get **1 reroll per game** (+1 from Persuasion). Click dice to hold them. Buttons: **Reroll**, **Reveal**.
- Hands, high to low: five of a kind, four of a kind, full house, straight (1–5 or 2–6), three of a kind, two pairs, a pair, only the sum.
- Same hand: compare the hand's faces (high first), then the total. **Only the sum** → the higher sum wins. Identical → a proper tie.
- Pity: after 2 losses in a row the next game is quietly rigged.
