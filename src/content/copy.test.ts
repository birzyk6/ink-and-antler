import { describe, expect, it } from 'vitest';
import { copy, items } from './copy';

describe('copy', () => {
  const all = JSON.stringify({ copy, items });

  it('never calls dice bones', () => {
    expect(all).not.toMatch(/bones/i);
  });

  it('uses the v2 cast only', () => {
    expect(all).not.toMatch(/Ossian|Pim/);
    expect(all).toMatch(/Haslin/);
    expect(all).toMatch(/Erl/);
  });

  it('names both items as scrolls', () => {
    expect(items.cv.name).toBe('Scroll of Curriculum Vitae');
    expect(items.letter.name).toBe('Scroll of Motivational Letter');
  });
});
