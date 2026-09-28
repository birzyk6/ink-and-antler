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
