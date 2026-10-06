import { NAME } from './copy';

export interface DocEntry {
  title: string;
  lines?: string[];
}

export interface DocSection {
  heading: string;
  entries: DocEntry[];
}

const plain = (titles: string[]): DocEntry[] => titles.map((title) => ({ title }));

/** From "CV_Larian - Michal Kulijewicz.pdf". Keep wording verbatim. */
export const CV: { title: string; subtitle: string[]; sections: DocSection[]; closing: string } = {
  title: NAME,
  subtitle: ['Poland, Kraków', '+48 694 482 078', 'kulijewiczmichal@gmail.com'],
  sections: [
    {
      heading: 'Experience',
      entries: [
        {
          title: '04.2024 - present - Newzoo - Games Taxonomy & Product Operations Analyst',
          lines: [
            'Game analysis, taking care of Newzoo’s internal database, writing articles, product management, financial analysis, research and consulting, preparing presentations, and public presentation of said presentations, market forecasting.',
            'And above all, working with an amazing team of industry professionals!',
          ],
        },
        {
          title: '04.2022 - 04.2023 - IBM - Treasury Analyst for Google',
          lines: ['Administration, analysing banking portals, conducting training for users and administrators, process automation.'],
        },
        { title: '01.1998 - present - unhealthy amount of part time (some would say odd) jobs and hustles where I gather inspirations and stories.' },
      ],
    },
    {
      heading: 'Education',
      entries: [{ title: '2017 - 2020 - University of Economics in Kraków', lines: ['Modern Business Management – bachelor degree'] }],
    },
    {
      heading: 'Skills',
      entries: plain([
        'Writing',
        'Songwriting',
        'Twine - making branching narrative RPG games',
        'English - C2',
        'Polish - Native',
        'Teamwork and cooperation - not a stranger to international teams',
        'Organization of work and time management',
        'Self-motivation and autonomy',
      ]),
    },
    {
      heading: 'Interests',
      entries: plain([
        'Songwriting and singing',
        'Writing books and scripts',
        'Game design',
        'Martial arts and winter sports',
        'Gaming - especially RPG’s!',
      ]),
    },
  ],
  closing: 'Above all, I love to learn and acquire new skills - it is my biggest motivation and my main hobby.',
};

/** From "Motivational Letter for Mr. Lalrian W.pdf". Keep wording and line breaks verbatim. */
export const MOTIVATION_LETTER = {
  opening: ['Once upon a time…', 'in a city of kings and dragons (allegedly), a man had a dream.', 'A dream of grandeur.'],
  poem: [
    [
      '“On his nightstand lies a quill, and even though no elven blood courses his veins,',
      "he's not afraid to spill his own, to feed the quill and pray to God.",
      'To Tir-Cendelius. The Poet.',
      'Though for a mere man an ill omen,',
      'thoughts of more muddle acumen.',
    ],
    [
      'And so he pours his life onto the pages,',
      'breathing soul both into the beauty,',
      'and into the dangers.',
      'Birthing worlds, gods and duty.',
      'Killing worlds, gods and duty.',
    ],
    [
      'Until his veins dry out by the thousandth cut,',
      'his mind deranged by the work of a god.',
      'See,',
      'a man was not made to rule over life.',
      'And yet he tries.',
    ],
    ['And dreams turn to nightmares. Yet grander.”'],
  ],
  closing: [
    'I might not be down for a blood sacrifice, but I’d love to write for the countless fans of Larian’s work all around the world.',
    'It would be a dream come true, to use my penmanship, creativity and passion to the benefit of the next great game of one of my favourite studios in the whole wide world.',
  ],
  signoff: 'Warm regards,',
  signature: NAME,
};
