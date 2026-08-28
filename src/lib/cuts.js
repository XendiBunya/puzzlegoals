// The cut ladder. Setup offers the first three as starting templates; the rest
// are only reached by outgrowing them. Invariant: a cut never has fewer tiles
// than there are steps, so every step earns at least one tile.
export const LADDER = [
  { cols: 4, rows: 3, label: 'Loose cut' },
  { cols: 5, rows: 4, label: 'Standard' },
  { cols: 6, rows: 5, label: 'Fine cut' },
  { cols: 7, rows: 6, label: 'Finer' },
  { cols: 8, rows: 7, label: 'Very fine' },
  { cols: 9, rows: 8, label: 'Finest' },
];

export const START_TEMPLATES = LADDER.slice(0, 3);
export const tileCount = (cut) => cut.cols * cut.rows;

export function rung(cols, rows) {
  const i = LADDER.findIndex((c) => c.cols === cols && c.rows === rows);
  return i < 0 ? 0 : i;
}

/** Climb the ladder until the cut holds at least `steps` tiles. */
export function fitCut(cols, rows, steps) {
  let j = rung(cols, rows);
  while (j < LADDER.length - 1 && tileCount(LADDER[j]) < steps) j++;
  return LADDER[j];
}

/** Smallest starting template that already fits, for the setup screen's default. */
export function suggestTemplate(steps) {
  const i = START_TEMPLATES.findIndex((c) => tileCount(c) >= steps);
  return i < 0 ? START_TEMPLATES.length - 1 : i;
}
