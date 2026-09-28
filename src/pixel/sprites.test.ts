import { describe, expect, it } from 'vitest';
import { mapToRuns } from './pixelMap';
import { SPRITE_REGISTRY, barRows, chainRows, signBoardRows } from './sprites';

describe('sprite maps', () => {
  it.each(SPRITE_REGISTRY)('$name is rectangular and uses only palette keys', ({ rows, palette }) => {
    expect(new Set(rows.map((r) => r.length)).size).toBe(1);
    expect(() => mapToRuns(rows, palette)).not.toThrow();
  });

  it('generators produce the requested sizes', () => {
    const board = signBoardRows(120, 36);
    expect(board).toHaveLength(36);
    expect(board[0]).toHaveLength(120);
    expect(board[0][0]).toBe('.');
    expect(barRows(150)).toHaveLength(4);
    expect(chainRows(4)).toHaveLength(16);
  });
});
