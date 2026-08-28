// Tile ownership.
//
// Every tile belongs to exactly one step, and finishing a step reveals exactly
// its own tiles. This is deliberately NOT "progress fraction -> fill the first
// N tiles in order": that version looks identical while you work top-to-bottom,
// but finishing step 13 first would light the tiles labelled 1. Ownership is
// what makes the numbers on the board honest.
//
// Tiles are identified by their position in the placement order (0..n-1), so a
// step's run is contiguous and lands as one blob on the board.

/** Deal every tile out evenly, in order. Returns new task objects. */
export function deal(tasks, n) {
  const T = tasks.length;
  if (!T) return tasks;
  return tasks.map((t, i) => {
    const tiles = [];
    for (let k = Math.floor((i * n) / T); k < Math.floor(((i + 1) * n) / T); k++) tiles.push(k);
    return { ...t, tiles };
  });
}

/** placement position -> 1-based step number (0 when unowned). */
export function owners(tasks, n) {
  const own = new Array(n).fill(0);
  tasks.forEach((t, i) => {
    (t.tiles || []).forEach((k) => { if (k >= 0 && k < n) own[k] = i + 1; });
  });
  return own;
}

/** The tiles of every finished step — the set that is actually on the board. */
export function revealedTiles(tasks) {
  const set = new Set();
  tasks.forEach((t) => { if (t.done) (t.tiles || []).forEach((k) => set.add(k)); });
  return set;
}

/**
 * Give a new step a tile by borrowing one from a step that has spares,
 * preferring an unfinished donor so nothing already on the board is taken back.
 * Returns new task objects.
 */
export function borrowTileFor(tasks, newTaskId) {
  const spare = (x) => x.id !== newTaskId && (x.tiles || []).length > 1;
  const fattest = (arr) =>
    arr.length ? arr.reduce((m, x) => (x.tiles.length > m.tiles.length ? x : m)) : null;
  const donor = fattest(tasks.filter((x) => spare(x) && !x.done)) || fattest(tasks.filter(spare));
  if (!donor) return tasks;

  const moved = donor.tiles[donor.tiles.length - 1];
  return tasks.map((t) => {
    if (t.id === donor.id) return { ...t, tiles: t.tiles.slice(0, -1) };
    if (t.id === newTaskId) return { ...t, tiles: [moved] };
    return t;
  });
}

/** Hand a removed step's tiles to a neighbour so the board stays fully owned. */
export function absorbTiles(tasks, removedIndex, orphaned) {
  if (!tasks.length || !orphaned?.length) return tasks;
  const nb = Math.min(Math.max(removedIndex - 1, 0), tasks.length - 1);
  return tasks.map((t, i) =>
    i === nb ? { ...t, tiles: [...t.tiles, ...orphaned].sort((a, b) => a - b) } : t
  );
}

/** Where the open part of the picture currently sits, normalised 0..1. */
export function revealHint(tasks, order, pieces, width, height) {
  const tiles = revealedTiles(tasks);
  if (!tiles.size) return null;
  let sx = 0, sy = 0;
  tiles.forEach((k) => { const p = pieces[order[k]]; sx += p.cx; sy += p.cy; });
  return { x: sx / tiles.size / width, y: sy / tiles.size / height };
}
