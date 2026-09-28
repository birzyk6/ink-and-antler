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
