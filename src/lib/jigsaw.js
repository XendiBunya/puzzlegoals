// Jigsaw geometry. Edges are generated once per grid line and shared by the two
// pieces either side of them (one traverses the stored segments, the other
// traverses them reversed), which is what guarantees the pieces interlock exactly.
import { mulberry32 } from './rng.js';

export const BOARD_W = 900;
export const BOARD_H = 675;

// One tab, normalised: runs (0,0) -> (1,0) with the knob bulging into +y.
// Each row is one cubic bezier: c1x, c1y, c2x, c2y, endx, endy.
const TAB = [
  [0.28, 0.0, 0.36, 0.0, 0.37, 0.05],
  [0.37, 0.16, 0.28, 0.19, 0.3, 0.29],
  [0.32, 0.41, 0.68, 0.41, 0.7, 0.29],
  [0.72, 0.19, 0.63, 0.16, 0.63, 0.05],
  [0.64, 0.0, 0.72, 0.0, 1.0, 0.0],
];

export function makeEdge(ax, ay, bx, by, sign, rand) {
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L, vx = -uy, vy = ux;
  const scale = (0.56 + rand() * 0.16) * sign;   // knob depth
  const shift = (rand() - 0.5) * 0.07;           // knob slides along the edge
  const squeeze = 0.88 + rand() * 0.26;          // knob widens / narrows

  const map = (nx, ny) => {
    let x = nx;
    if (nx > 0.001 && nx < 0.999) {
      x = Math.min(0.93, Math.max(0.07, 0.5 + (nx - 0.5) * squeeze + shift));
    }
    return [ax + ux * x * L + vx * ny * L * scale, ay + uy * x * L + vy * ny * L * scale];
  };

  const segs = TAB.map((s) => {
    const c1 = map(s[0], s[1]), c2 = map(s[2], s[3]), p = map(s[4], s[5]);
    return [c1[0], c1[1], c2[0], c2[1], p[0], p[1]];
  });
  return { start: [ax, ay], segs };
}

/** A cubic run traversed backwards: reverse the order and swap each pair of handles. */
export function reverseEdge(e) {
  const pts = [e.start, ...e.segs.map((s) => [s[4], s[5]])];
  const segs = [];
  for (let i = e.segs.length - 1; i >= 0; i--) {
    const s = e.segs[i];
    segs.push([s[2], s[3], s[0], s[1], pts[i][0], pts[i][1]]);
  }
  return { start: pts[pts.length - 1], segs };
}

const segD = (e) => e.segs.map((s) => 'C ' + s.map((n) => n.toFixed(2)).join(' ')).join(' ');

export function cutPuzzle({ cols, rows, seed, width = BOARD_W, height = BOARD_H }) {
  const rand = mulberry32(seed), cw = width / cols, ch = height / rows;
  const hE = [], vE = [];
  for (let r = 1; r < rows; r++) {
    hE[r] = [];
    for (let c = 0; c < cols; c++) {
      hE[r][c] = makeEdge(c * cw, r * ch, (c + 1) * cw, r * ch, rand() < 0.5 ? 1 : -1, rand);
    }
  }
  for (let r = 0; r < rows; r++) {
    vE[r] = [];
    for (let c = 1; c < cols; c++) {
      vE[r][c] = makeEdge(c * cw, r * ch, c * cw, (r + 1) * ch, rand() < 0.5 ? 1 : -1, rand);
    }
  }

  const pieces = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = (c * cw).toFixed(2), y0 = (r * ch).toFixed(2);
      const x1 = ((c + 1) * cw).toFixed(2), y1 = ((r + 1) * ch).toFixed(2);
      let d = `M ${x0} ${y0} `;
      d += r === 0 ? `L ${x1} ${y0} ` : segD(hE[r][c]) + ' ';
      d += c === cols - 1 ? `L ${x1} ${y1} ` : segD(vE[r][c + 1]) + ' ';
      d += r === rows - 1 ? `L ${x0} ${y1} ` : segD(reverseEdge(hE[r + 1][c])) + ' ';
      d += c === 0 ? 'Z' : segD(reverseEdge(vE[r][c])) + ' Z';
      pieces.push({ r, c, d, cx: (c + 0.5) * cw, cy: (r + 0.5) * ch });
    }
  }
  return pieces;
}

/**
 * The order tiles are dealt in. Grows outward from a seed cell so a step's run
 * of tiles lands as one blob rather than scattered confetti. `hint` (normalised
 * 0..1) steers the start, which is how a re-cut reopens the same part of the picture.
 */
export function placementOrder({ cols, rows, seed, hint }) {
  const rand = mulberry32(seed ^ 0x9e3779b9), n = cols * rows;
  const placed = new Set(), order = [], frontier = new Set();
  const idx = (r, c) => r * cols + c;

  let first = Math.floor(rand() * n);
  if (hint) {
    const c = Math.min(cols - 1, Math.max(0, Math.round(hint.x * cols - 0.5)));
    const r = Math.min(rows - 1, Math.max(0, Math.round(hint.y * rows - 0.5)));
    first = r * cols + c;
  }

  const push = (i) => {
    order.push(i); placed.add(i); frontier.delete(i);
    const r = Math.floor(i / cols), c = i % cols;
    [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([rr, cc]) => {
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols && !placed.has(idx(rr, cc))) {
        frontier.add(idx(rr, cc));
      }
    });
  };

  push(first);
  while (order.length < n) {
    const pool = frontier.size
      ? [...frontier]
      : [...Array(n).keys()].filter((i) => !placed.has(i));
    push(pool[Math.floor(rand() * pool.length)]);
  }
  return order;
}
