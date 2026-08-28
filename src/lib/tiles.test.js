import { describe, it, expect } from 'vitest';
import { createGoal, addTask, toggleTask, removeTask, pieceTotal } from './goal.js';
import { owners, revealedTiles } from './tiles.js';
import { START_TEMPLATES, tileCount, fitCut } from './cuts.js';

const build = (n, template = 0) =>
  createGoal({
    name: 'Test goal',
    steps: Array.from({ length: n }, (_, i) => `Step ${i + 1}`),
    img: 'data:,',
    template: START_TEMPLATES[template],
  });

const finish = (g, oneBasedIndexes) =>
  oneBasedIndexes.reduce((acc, i) => toggleTask(acc, acc.tasks[i - 1].id), g);

/** Every lit tile's badge number, deduped and sorted. */
const litBadges = (g) => {
  const own = owners(g.tasks, pieceTotal(g));
  return [...new Set([...revealedTiles(g.tasks)].map((k) => own[k]))].sort((a, b) => a - b);
};

const doneNumbers = (g) =>
  g.tasks.map((t, i) => (t.done ? i + 1 : null)).filter(Boolean);

const isPartition = (g) => {
  const seen = new Array(pieceTotal(g)).fill(0);
  g.tasks.forEach((t) => (t.tiles || []).forEach((k) => seen[k]++));
  return seen.every((c) => c === 1);
};

describe('tile ownership', () => {
  it('gives every tile exactly one owner', () => {
    [4, 12, 13, 20, 31].forEach((n) => expect(isPartition(build(n))).toBe(true));
  });

  it('lights only the tiles belonging to the finished step', () => {
    // The original bug: 13 steps over 20 tiles, finishing step 13 first lit
    // two tiles badged "1", because progress was a count rather than a set.
    const g = finish(build(13), [13]);
    expect(litBadges(g)).toEqual([13]);
  });

  it('keeps badges honest for any completion order', () => {
    const g = finish(build(13), [3, 11, 1, 7, 5]);
    expect(litBadges(g)).toEqual(doneNumbers(g));
    expect(isPartition(g)).toBe(true);
  });

  it('reveals the whole picture exactly when every step is done', () => {
    const g = finish(build(12), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(revealedTiles(g.tasks).size).toBe(pieceTotal(g));
  });

  it('reveals nothing when nothing is done', () => {
    expect(revealedTiles(build(12).tasks).size).toBe(0);
  });
});

describe('adding a step', () => {
  it('never takes a placed tile back off the board', () => {
    let g = finish(build(12, 2), [1, 2, 3, 4]);   // 30-tile cut, room to borrow
    const before = revealedTiles(g.tasks).size;
    g = addTask(g, 'Step 13');
    expect(revealedTiles(g.tasks).size).toBeGreaterThanOrEqual(before);
    expect(isPartition(g)).toBe(true);
  });

  it('keeps badges matching after the borrow', () => {
    let g = finish(build(12, 2), [2, 5, 9]);
    g = addTask(g, 'Step 13');
    expect(litBadges(g)).toEqual(doneNumbers(g));
  });

  it('gives the new step a tile of its own', () => {
    const g = addTask(build(10, 2), 'Fresh step');
    expect(g.tasks.at(-1).tiles.length).toBeGreaterThan(0);
  });
});

describe('the cut ladder', () => {
  it('climbs so the cut always holds every step', () => {
    let g = build(12);
    expect(pieceTotal(g)).toBe(12);
    g = addTask(g, 'Step 13');
    expect(pieceTotal(g)).toBe(20);
    for (let i = 14; i <= 21; i++) g = addTask(g, `Step ${i}`);
    expect(pieceTotal(g)).toBe(30);
    expect(g.tasks.length).toBe(21);
    expect(isPartition(g)).toBe(true);
  });

  it('respects the chosen template as a floor, not a ceiling', () => {
    expect(pieceTotal(build(8, 2))).toBe(30);          // fine cut, few steps
    expect(fitCut(4, 3, 40)).toEqual({ cols: 7, rows: 6, label: 'Finer' });
  });

  it('caps out and lets steps share only past the finest cut', () => {
    const finest = tileCount({ cols: 9, rows: 8 });
    const g = build(90);
    expect(pieceTotal(g)).toBe(finest);
    expect(g.tasks.filter((t) => t.tiles.length === 0).length).toBeGreaterThan(0);
    expect(isPartition(g)).toBe(true);
  });

  it('holds roughly the same share of the picture open across a re-cut', () => {
    const before = finish(build(12), [1, 2, 3, 4, 5, 6]);
    const share = revealedTiles(before.tasks).size / pieceTotal(before);
    const after = addTask(before, 'Step 13');
    const newShare = revealedTiles(after.tasks).size / pieceTotal(after);
    expect(Math.abs(newShare - share)).toBeLessThan(0.12);
    expect(litBadges(after)).toEqual(doneNumbers(after));
  });
});

describe('removing a step', () => {
  it('leaves the board fully owned', () => {
    let g = finish(build(12), [1, 2, 3]);
    g = removeTask(g, g.tasks[5].id);
    expect(isPartition(g)).toBe(true);
    expect(litBadges(g)).toEqual(doneNumbers(g));
  });

  it('grows the picture when unfinished work is dropped', () => {
    let g = finish(build(12), [1, 2, 3]);
    const before = revealedTiles(g.tasks).size;
    g = removeTask(g, g.tasks[3].id);            // an unfinished step
    expect(revealedTiles(g.tasks).size).toBeGreaterThanOrEqual(before);
  });
});
