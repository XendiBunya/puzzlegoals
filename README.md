# PuzzleGoals

Goal tracking that assembles a jigsaw. Your steps are the cut lines: finish one,
and its tiles are set down on the board.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # logic regression suite
npm run build    # -> dist/
```

## Layout

```
src/lib/         pure logic — no DOM, no React, fully tested
  jigsaw.js      die-cut geometry: interlocking bezier edges, placement order
  tiles.js       which step owns which tile
  goal.js        the goal document and every transition it can make
  cuts.js        the cut ladder (12 -> 20 -> 30 -> 42 -> 56 -> 72)
  rng.js         seeded PRNG — every visual decision is reproducible
  covers.js      built-in box tops, drawn on a canvas at runtime
  storage.js     persistence seam (see "Known limits")
src/components/  React rendering
prototype/       the original single-file prototype, kept for reference
```

`src/lib` is the part worth protecting. It is framework-agnostic and covered by
tests; the components are just a way to draw it.

## Two rules the tests exist to defend

**A step owns its tiles.** Finishing a step reveals exactly the tiles carrying
its number. The tempting alternative — "progress fraction, fill the first N tiles
in order" — looks identical while you work top-to-bottom, but finishing step 13
first lights the tiles labelled 1. That bug shipped in the prototype and is now
pinned by a test.

**Adding work never takes a placed tile back.** A new step borrows a spare tile
from a step that has more than one, preferring an unfinished donor. When the cut
can no longer hold every step it climbs the ladder and redeals, keeping roughly
the same share of the picture open, reopening the same area.

## Known limits

- **`localStorage` is not a persistence layer.** Per-browser, per-device, empty in
  private windows. Everything is behind `src/lib/storage.js`; replacing it with an
  account-backed store is the next structural job.
- **Uploaded photos are base64 data URIs in that same ~5MB budget.** Real uploads
  need blob storage. `saveGoal` reports a quota failure but nothing acts on it yet.
- **One goal at a time.** The document supports exactly one; a goal list is additive.
- **A stalled puzzle is a guilt object.** A half-finished picture reads worse than a
  stale checklist. There is no graceful way to shelve a goal yet.
