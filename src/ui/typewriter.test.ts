import { describe, expect, it } from 'vitest';
import { typedSlice } from './typewriter';

describe('typedSlice', () => {
  it('reveals characters over time', () => {
    const text = 'Hail, traveller. You have the look of someone searching.';
    expect(typedSlice(text, 0)).toBe('');
    expect(typedSlice(text, 500, 40)).toBe(text.slice(0, 20));
    expect(typedSlice(text, Infinity)).toBe(text);
  });
});
