import { describe, it, expect } from 'vitest';
import { cutPuzzle, placementOrder, makeEdge, reverseEdge, BOARD_W, BOARD_H } from './jigsaw.js';
import { mulberry32 } from './rng.js';

describe('jigsaw geometry', () => {
  it('cuts one path per piece', () => {
    expect(cutPuzzle({ cols: 5, rows: 4, seed: 42 })).toHaveLength(20);
  });

  it('is deterministic for a seed, which is what survives a reload', () => {
    const a = cutPuzzle({ cols: 5, rows: 4, seed: 42 }).map((p) => p.d);
    const b = cutPuzzle({ cols: 5, rows: 4, seed: 42 }).map((p) => p.d);
    expect(a).toEqual(b);
    expect(cutPuzzle({ cols: 5, rows: 4, seed: 43 }).map((p) => p.d)).not.toEqual(a);
  });

  it('closes every piece path', () => {
    cutPuzzle({ cols: 4, rows: 3, seed: 7 }).forEach((p) => {
      expect(p.d.startsWith('M ')).toBe(true);
      expect(p.d.trim().endsWith('Z')).toBe(true);
    });
  });

  it('reverses an edge back onto the same curve, so neighbours interlock', () => {
    const e = makeEdge(0, 0, 100, 0, 1, mulberry32(9));
    const back = reverseEdge(e);
    expect(back.start).toEqual([e.segs.at(-1)[4], e.segs.at(-1)[5]]);
    expect(reverseEdge(back).start).toEqual(e.start);
    expect(reverseEdge(back).segs).toEqual(e.segs);
  });
});

describe('placement order', () => {
  it('visits every tile exactly once', () => {
    const order = placementOrder({ cols: 6, rows: 5, seed: 11 });
    expect(new Set(order).size).toBe(30);
  });

  it('grows outward, so each step\'s run lands as one blob', () => {
    const cols = 6, rows = 5;
    const order = placementOrder({ cols, rows, seed: 11 });
    const placed = new Set([order[0]]);
    for (let k = 1; k < order.length; k++) {
      const i = order[k], r = Math.floor(i / cols), c = i % cols;
      const touching = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
        .some(([rr, cc]) => rr >= 0 && rr < rows && cc >= 0 && cc < cols && placed.has(rr * cols + cc));
      expect(touching).toBe(true);
      placed.add(i);
    }
  });

  it('starts near the hint, so a re-cut reopens the same area', () => {
    const order = placementOrder({ cols: 6, rows: 5, seed: 11, hint: { x: 0.9, y: 0.9 } });
    const first = order[0];
    expect(Math.floor(first / 6)).toBe(4);
    expect(first % 6).toBe(5);
  });
});
