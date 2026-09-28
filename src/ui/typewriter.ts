export const CHARS_PER_SECOND = 40;

export function typedSlice(text: string, elapsedMs: number, cps = CHARS_PER_SECOND): string {
  if (elapsedMs <= 0) return '';
  return text.slice(0, Math.floor((elapsedMs * cps) / 1000));
}
