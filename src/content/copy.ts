import type { Ability, CheckId } from '../game/checks';
import type { HandRank } from '../game/dice';
import type { ItemId } from '../game/items';

/** If a chosen font has no "ł", change this to 'Michal Kulijewicz'. */
export const NAME = 'Michał Kulijewicz';
export const FIRST_NAME = NAME.split(' ')[0];
export const SIGN_NAME = 'The Ink & Antler';
export const SIGN_SUBTITLE = `Home of ${NAME}, Writer`;

export const CONTACT = { email: 'kulijewiczmichal@gmail.com', linkedin: 'https://www.linkedin.com/in/varmblixt' };
/** Files in /public. */
export const PDF: Record<ItemId, string> = { cv: '/michal-kulijewicz-cv.pdf', letter: '/michal-kulijewicz-letter.pdf' };

export const items: Record<
  ItemId,
  { name: string; rarity: 'Legendary' | 'Rare'; flavour: string; attribution?: string; weight: number }
> = {
  cv: { name: 'Scroll of Curriculum Vitae', rarity: 'Legendary', flavour: 'YOU SHALL EMPLOY ME! …pretty please?', weight: 0.1 },
  letter: {
    name: 'Scroll of Motivational Letter',
    rarity: 'Rare',
    flavour: 'The ship is safest when it is in port, but that’s not what ships were built for.',
    attribution: 'Paulo Coelho',
    weight: 0.1,
  },
};

export const copy = {
  loading: 'Rolling for initiative…',
  speaker: 'Haslin',
  greeting: [
    'Welcome, traveller. You must be here, searching for the legendary scrolls… Am I right?',
    'How do I know? Nature has its ways, traveller.',
  ],
  hint: 'Click the druid to speak.',
  nudge: 'Erl says you shan’t be shy. Just click.',
  satchelHint: 'Open your satchel to read it.',
  originPrompt: 'Before we get to business, my name is Haslin, yes, related to Halsin. And yes, also a druid. Who stands before me?',
  origins: {
    CHA: {
      label: 'I’m a minstrel, from a land of wonders, crossing these borders to broaden my choices. And those scrolls are… ekhm… heard those are real good.',
      reply: 'Ahhh, a poet. Erl, fetch the dice. The ones Volo gifted us. We shall play.',
    },
    INT: {
      label: 'A scholar. My hunger for knowledge knows no bounds. And I heard these scrolls are a wellspring of, well… knowledge.',
      reply: 'Your pursuit is commendable, but nature is of fickle, well… nature. Thus you shall put your fate in dice.',
    },
    DEX: { label: 'A crook.', reply: 'And definitely not level one. Erl, dice.' },
    WIS: {
      label: 'Halins, yes, related to Halsin.',
      reply: 'Ha! A small world, I never got along with your side of the family. Blood or not, we shall play either way.',
    },
  } satisfies Record<Ability, { label: string; reply: string }>,
  wagerPrompt: 'Two ancient scrolls. Both worth a small fortune, and if it smiles at you, you can have them. What will be our first wager?',
  wagerChoice: { cv: 'The scroll.', letter: 'The other scroll.' } satisfies Record<ItemId, string>,
  checkPrompt: 'Shall we?',
  oneLeft: 'One treasure remains. Same terms. Shall we?',
  justRoll: 'Just roll the dice.',
  checks: {
    persuasion: {
      label: 'Surely a guest rolls first. And twice?',
      success: 'You know what? Go ahead, let us level the playing field.',
      fail: 'Surely not.',
    },
    investigation: {
      label: 'Let me take a look at those dice.',
      success: '…is that one a sphere? Ahh… that’s Erl’s pet project, he’s been rolling it non stop for the past 200 days or so. Here, a fresh one.',
      fail: 'They’re dice. They have dots. Well spotted.',
    },
    sleight: {
      label: 'Do the old switcheroo.',
      success: 'Haslin is none the wiser. Erl is wiser, winks at you.',
      fail: 'Haslin is none the wiser. Erl is wiser, and you’ve been busted.',
    },
    animal: {
      label: 'Offer Erl a Rivellon Fry.',
      success: 'Erl accepts. Erl devours. Erl approves.',
      fail: 'Erl eats the fry, frowns and flies away. Classic Erl.',
    },
  } satisfies Record<CheckId, { label: string; success: string; fail: string }>,
  effects: {
    persuasion: '+1 reroll',
    investigation: '+1 to your lowest die',
    sleight: 'your lowest die becomes a 6',
    animal: 'ties go to you',
  } satisfies Record<CheckId, string>,
  nat1: 'Erl cocks his head, blinks. His screeches… a chuckle?',
  rollContinue: 'Let the dice fall.',
  dice: {
    haslin: 'Haslin',
    you: 'You',
    hiddenDie: 'Haslin’s die, hidden',
    reroll: 'Reroll',
    rerollsLeft: (n: number) => `${n} left`,
    reveal: 'Reveal',
    holdHint: 'Click your dice to hold them, then reroll the rest, or reveal.',
    stake: 'Stake',
  },
  hands: {
    five: 'Five of a kind',
    four: 'Four of a kind',
    fullHouse: 'Full house',
    straight: 'Straight',
    three: 'Three of a kind',
    twoPairs: 'Two pairs',
    pair: 'A pair',
    sum: 'Only the sum',
  } satisfies Record<HandRank, string>,
  win: 'The dice rarely lie. Enjoy the read, traveller.',
  tieErl: 'A tie!… excuse me?! … well… Erl, ekhm… the rule of hospitality commend us, to deem this a victory of the guest… you, that is.',
  tie: 'A tie! The dice can’t decide. Again, then.',
  lose: 'You know what a druid says after a game of dice? It’s dicided, I win!',
  rematch: 'The dice seem fond of you. Shall we play another round?',
  again: 'Again.',
  takeIt: 'Take it.',
  prize: {
    cv: 'The Scroll of Curriculum Vitae is yours.',
    letter: 'The Scroll of Motivational Letter is yours.',
  } satisfies Record<ItemId, string>,
  doubleOrNothing: 'Double or nothing, traveller. The other scroll against the one in your satchel.',
  received: (name: string) => `${name} added to your satchel.`,
  epilogue: [
    'Both scrolls are now yours, traveller. I trust you will find a great use for the power stored within.',
    'When you are done here, the cat in the lower section of the city should know how to reach the scribe.',
    'Farewell, traveller.',
  ],
  farewell: 'Farewell.',
  /** Each is spoken once, in order, then Haslin has nothing more to say. */
  barks: [
    'You already got the scrolls. No, I’m not betting Erl.',
    'I have a one-on-one scry in 15 minutes, go and read your scrolls.',
  ],
  rewind: 'Rewind',
  druidLabel: 'Talk to Haslin the druid',
  /** Hover nameplates under the characters. */
  nameplates: {
    druid: { name: 'Haslin', sub: 'and Erl, the owl' },
    cat: { name: 'The Cat', sub: 'Pet me' },
  },
  satchel: { title: 'Satchel', empty: 'Empty. For now.', open: 'Open satchel', type: 'Scroll', weight: 'Weight' },
  viewer: { close: 'Roll it up', pdf: 'Take a copy (PDF)' },
  cat: { label: 'Pet the cat', meow: 'Mrrrow.' },
  fastTravel: {
    title: 'Fast Travel',
    intro: 'Fast Travel to:',
    postal: 'Postal Office',
    guild: 'Guild Hall',
    linkedin: 'LinkedIn',
    copied: 'Email copied to your clipboard.',
    copyHint: 'Click to copy',
    close: 'Farewell',
  },
  skip: 'Skip the tale →',
  reset: 'Begin anew',
  portraitGate: { text: 'The town is wider than your screen. Turn your device sideways, traveller.', anyway: 'Read the scroll anyway' },
};
