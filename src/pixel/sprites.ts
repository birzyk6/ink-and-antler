import { P } from './palette';
import type { Palette } from './pixelMap';

export const WOOD: Palette = { o: P.outline, D: P.woodDark, W: P.wood, L: P.woodLight, G: P.goldDark };
export const IRON: Palette = { o: P.outline, I: P.ironLight, i: P.iron };
export const IRON_WOOD: Palette = { o: P.outline, I: P.ironLight, W: P.wood };
export const FLAME: Palette = { a: P.flame1, b: P.flame2, c: P.flame3 };
export const LEATHER: Palette = { o: P.outline, D: P.leatherDark, L: P.leather, l: P.leatherLight, G: P.gold };
export const SEAL_PALETTE: Palette = { o: P.redDark, R: P.red, r: P.redDark, G: P.gold };
export const GOLD: Palette = { o: P.outline, G: P.gold, g: P.goldDark };
export const CURSOR_PALETTE: Palette = { o: P.outline, P: P.parchment };
export const CLOUD_PALETTE: Palette = { o: '#9fb8d8', W: '#ffffff', B: '#dce8f5' };

export const SATCHEL = [
  '.....oooooo.....',
  '....oDDDDDDo....',
  '...oD......Do...',
  '...oD......Do...',
  '.oooooooooooooo.',
  'oLLLLLLLLLLLLLLo',
  'olllllllllllllLo',
  'oDDDDDDoGoDDDDDo',
  'oLLLLLLoGoLLLLLo',
  'oLLLLLLoooLLLLLo',
  'oLLLLLLLLLLLLLLo',
  'oLLLLLLLLLLLLLLo',
  'oDLLLLLLLLLLLLDo',
  'oDDLLLLLLLLLLDDo',
  '.oDDDDDDDDDDDDo.',
  '..oooooooooooo..',
];

export const SEAL = [
  '..oooooo..',
  '.oRRRRRRo.',
  'oRRrrrrRRo',
  'oRrRRRRrRo',
  'oRrRGGRrRo',
  'oRrRRRRrRo',
  'oRRrrrrRRo',
  '.oRRRRRRo.',
  '..oooooo..',
];

export const MARKER = [
  '.ooo.',
  'oGGGo',
  'oGGGo',
  'oGGGo',
  'oGGGo',
  'oGgGo',
  '.oGo.',
  '..o..',
  '.....',
  '.ooo.',
  'oGGGo',
  '.ooo.',
];

export const CURSOR = [
  'o......',
  'oo.....',
  'oPo....',
  'oPPo...',
  'oPPPo..',
  'oPPPPo.',
  'oPPPPPo',
  'oPPoooo',
  'oPo....',
  'oo.....',
];

export const TORCH = [
  '.oooooo.',
  'oIIIIIIo',
  '.oIIIIo.',
  '..oWWo..',
  '..oWWo..',
  '..oWWo..',
  '..oWWo..',
  '..oWWo..',
  '..oWWo..',
  '...oo...',
];

export const FLAMES = [
  ['....c...', '...cbc..', '..cbbc..', '..cbabc.', '.cbaabc.', '.cbaabc.', '..cbbc..'],
  ['...c....', '...cc...', '..cbbc..', '.cbabc..', '.cbaabc.', '.cbaabc.', '..cbbc..'],
  ['.....c..', '....cc..', '...cbbc.', '..cbabc.', '.cbaabc.', '.cbaabc.', '..cbbc..'],
];

export const CLOUD = [
  '........oooo............',
  '......ooWWWWoo..oooo....',
  '....ooWWWWWWWWooWWWWoo..',
  '..ooWWWWWWWWWWWWWWWWWWo.',
  '.oWWWWWWWWWWWWWWWWWWWWWo',
  'oBBWWWWWWWWWWWWWWWWWWWBo',
  '.oBBBBBBBBBBBBBBBBBBBBo.',
  '..oooooooooooooooooooo..',
];

const POST = '......oWWo......';
export const SIGNPOST = [
  '.......oo.......',
  POST,
  'oooooooWWooooo..',
  'oLLLLLLLLLLLLLo.',
  'oWWWWWWWWWWWWWWo',
  'oWWWWWWWWWWWWWo.',
  'oooooooWWooooo..',
  POST,
  '..oooooWWooooooo',
  '.oLLLLLLLLLLLLLo',
  'oWWWWWWWWWWWWWWo',
  '.oWWWWWWWWWWWWWo',
  '..oooooWWooooooo',
  POST, POST, POST, POST, POST, POST, POST, POST, POST,
  '.....oDDDDo.....',
  '....oooooooo....',
];

/** Carved oak board: outline, dark frame, gold inlay, planks with grain. Uses the WOOD palette. */
export function signBoardRows(w: number, h: number): string[] {
  const rows: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const corner = (x === 0 || x === w - 1) && (y === 0 || y === h - 1);
      const d = Math.min(x, y, w - 1 - x, h - 1 - y);
      if (corner) row += '.';
      else if (d === 0) row += 'o';
      else if (d <= 2) row += 'D';
      else if (d === 3) row += 'G';
      else if (d === 4) row += 'D';
      else if ((y - 5) % 9 === 8) row += 'D';
      else if ((x * 7 + y * 13) % 23 === 0 || (x * 3 + y * 5) % 31 === 0) row += 'L';
      else row += 'W';
    }
    rows.push(row);
  }
  return rows;
}

/** Wrought-iron beam the sign hangs from. Uses the IRON palette. */
export function barRows(w: number): string[] {
  return ['o'.repeat(w), `o${'I'.repeat(w - 2)}o`, `o${'i'.repeat(w - 2)}o`, 'o'.repeat(w)];
}

const CHAIN_LINK = ['.oo.', 'o..o', 'o..o', '.oo.'];
export function chainRows(links: number): string[] {
  return Array.from({ length: links }, () => CHAIN_LINK).flat();
}

export const SPRITE_REGISTRY: { name: string; rows: string[]; palette: Palette }[] = [
  { name: 'satchel', rows: SATCHEL, palette: LEATHER },
  { name: 'seal', rows: SEAL, palette: SEAL_PALETTE },
  { name: 'marker', rows: MARKER, palette: GOLD },
  { name: 'cursor', rows: CURSOR, palette: CURSOR_PALETTE },
  { name: 'torch', rows: TORCH, palette: IRON_WOOD },
  ...FLAMES.map((rows, i) => ({ name: `flame${i}`, rows, palette: FLAME })),
  { name: 'cloud', rows: CLOUD, palette: CLOUD_PALETTE },
  { name: 'signpost', rows: SIGNPOST, palette: WOOD },
  { name: 'board', rows: signBoardRows(120, 36), palette: WOOD },
  { name: 'bar', rows: barRows(150), palette: IRON },
  { name: 'chain', rows: chainRows(4), palette: IRON },
];
