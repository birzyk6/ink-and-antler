export type Palette = Record<string, string>;

export interface PixelRun {
  x: number;
  y: number;
  w: number;
  color: string;
}

/** Converts rows of palette keys into horizontal same-colour runs. '.' and ' ' are transparent. */
export function mapToRuns(rows: readonly string[], palette: Palette): PixelRun[] {
  const runs: PixelRun[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (ch !== '.' && ch !== ' ') {
        const color = palette[ch];
        if (!color) throw new Error(`Unknown palette key "${ch}" at ${x},${y}`);
        runs.push({ x, y, w: end - x, color });
      }
      x = end;
    }
  });
  return runs;
}

export function mapSize(rows: readonly string[]): { w: number; h: number } {
  return { w: Math.max(...rows.map((r) => r.length)), h: rows.length };
}
