import { useEffect, useMemo, useRef } from 'react';
import { cutPuzzle, placementOrder, BOARD_W as W, BOARD_H as H } from '../lib/jigsaw.js';
import { owners, revealedTiles } from '../lib/tiles.js';
import { mulberry32 } from '../lib/rng.js';

/**
 * React owns the static SVG — the die-cut paths, clips, badges. The enter/exit
 * animation is driven imperatively in an effect instead: it needs a forced
 * reflow between "place off-board" and "release", which is exactly the kind of
 * frame-level control the render cycle can't express.
 */
export default function PuzzleMat({ goal, geometry, solved }) {
  const { pieces, order, pos } = geometry;
  const matRef = useRef(null);
  const prevShown = useRef(null);

  const n = pieces.length;
  const own = useMemo(() => owners(goal.tasks, n), [goal.tasks, n]);
  const shown = useMemo(() => {
    const tiles = revealedTiles(goal.tasks);
    return new Set([...tiles].map((k) => order[k]));
  }, [goal.tasks, order]);

  const badge = useMemo(() => {
    const cw = W / goal.cols, ch = H / goal.rows;
    const r = Math.max(11, Math.min(16, Math.min(cw, ch) * 0.095));
    return { r, off: r * 1.75, fs: (r * 1.16).toFixed(1), cw, ch };
  }, [goal.cols, goal.rows]);

  // A new cut is a whole new board; forget what was on the old one.
  useEffect(() => { prevShown.current = null; }, [goal.cols, goal.rows, goal.seed]);

  useEffect(() => {
    const root = matRef.current;
    if (!root) return;
    const first = prevShown.current === null;
    const before = prevShown.current ?? new Set();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rand = mulberry32(goal.seed ^ 0x51ed);

    root.querySelectorAll('.pc').forEach((g) => {
      const i = Number(g.dataset.i);
      const want = shown.has(i), had = before.has(i);
      if (first) { g.style.display = want ? '' : 'none'; g.classList.remove('incoming', 'leaving'); return; }
      if (want === had) return;

      const ang = rand() * Math.PI * 2, dist = 520 + rand() * 260;
      g.style.setProperty('--dx', `${(Math.cos(ang) * dist).toFixed(0)}px`);
      g.style.setProperty('--dy', `${(Math.sin(ang) * dist * 0.7).toFixed(0)}px`);
      g.style.setProperty('--rot', `${((rand() - 0.5) * 150).toFixed(0)}deg`);

      if (want) {
        g.style.display = '';
        if (reduce) { g.classList.remove('incoming', 'leaving'); return; }
        g.classList.remove('leaving');
        g.classList.add('incoming');
        requestAnimationFrame(() => requestAnimationFrame(() => g.classList.remove('incoming')));
      } else {
        if (reduce) { g.style.display = 'none'; g.classList.remove('incoming', 'leaving'); return; }
        g.classList.add('leaving');
        setTimeout(() => {
          if (g.classList.contains('leaving')) { g.style.display = 'none'; g.classList.remove('leaving'); }
        }, 420);
      }
    });

    prevShown.current = shown;
  }, [shown, goal.seed]);

  const badgeFor = (p, i) => {
    const bx = (p.c * badge.cw + badge.off).toFixed(1);
    const by = (p.r * badge.ch + badge.off).toFixed(1);
    const label = own[pos[i]] ? String(own[pos[i]]) : '';
    return (
      <g className="badge" key={`b${i}`}>
        <circle cx={bx} cy={by} r={badge.r.toFixed(1)} />
        <text x={bx} y={by} dy=".36em" fontSize={badge.fs}>{label}</text>
      </g>
    );
  };

  return (
    <div className={`mat${solved ? ' solved' : ''}`} ref={matRef}>
      <svg
        key={`${goal.cols}x${goal.rows}x${goal.seed}`}
        className="board"
        viewBox={`-24 -24 ${W + 48} ${H + 48}`}
        role="img"
        aria-label={`Puzzle of your goal: ${shown.size} of ${n} pieces placed`}
      >
        <defs>
          {pieces.map((p, i) => (
            <clipPath id={`clip${i}`} key={`c${i}`}><path d={p.d} /></clipPath>
          ))}
        </defs>
        <rect className="matbg" x="0" y="0" width={W} height={H} rx="3" />
        <image className="backing" href={goal.img} x="0" y="0" width={W} height={H}
          preserveAspectRatio="xMidYMid slice" />
        <g className="ghost">{pieces.map((p, i) => <path d={p.d} key={`g${i}`} />)}</g>
        <g className="ghostnums">
          {pieces.map((p, i) => (
            <g key={`gn${i}`} style={{ display: shown.has(i) ? 'none' : '' }}>{badgeFor(p, i)}</g>
          ))}
        </g>
        {pieces.map((p, i) => (
          <g className="pc" data-i={i} key={`p${i}`} style={{ display: 'none' }}>
            <g clipPath={`url(#clip${i})`}>
              <image href={goal.img} x="0" y="0" width={W} height={H}
                preserveAspectRatio="xMidYMid slice" />
              <path className="pc-edge" d={p.d} />
            </g>
            {badgeFor(p, i)}
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Geometry is derived, never stored — the seed and cut are the only truth. */
export function useGeometry(goal) {
  return useMemo(() => {
    const pieces = cutPuzzle({ cols: goal.cols, rows: goal.rows, seed: goal.seed });
    const order = placementOrder({
      cols: goal.cols, rows: goal.rows, seed: goal.seed, hint: goal.startHint,
    });
    const pos = [];
    order.forEach((pieceIndex, k) => { pos[pieceIndex] = k; });
    return { pieces, order, pos };
  }, [goal.cols, goal.rows, goal.seed, goal.startHint]);
}
