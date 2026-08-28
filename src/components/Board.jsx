import { useEffect, useRef, useState } from 'react';
import PuzzleMat, { useGeometry } from './PuzzleMat.jsx';
import TaskPanel from './TaskPanel.jsx';
import { pieceTotal } from '../lib/goal.js';
import { revealedTiles, revealHint } from '../lib/tiles.js';
import { BOARD_W, BOARD_H } from '../lib/jigsaw.js';

export default function Board({ goal, dispatch }) {
  const geometry = useGeometry(goal);
  const total = pieceTotal(goal);
  const placed = revealedTiles(goal.tasks).size;
  const solved = placed === total && total > 0;

  const [recutNote, setRecutNote] = useState(null);
  const prevCut = useRef(`${goal.cols}x${goal.rows}`);

  useEffect(() => {
    const cut = `${goal.cols}x${goal.rows}`;
    if (prevCut.current === cut) return;
    prevCut.current = cut;
    setRecutNote(`Re-cut to ${total} pieces`);
    const fade = setTimeout(() => setRecutNote(null), 3400);
    return () => clearTimeout(fade);
  }, [goal.cols, goal.rows, total]);

  const add = (text) => {
    // Captured before the cut can change, so a re-cut reopens the same area.
    const hint = revealHint(goal.tasks, geometry.order, geometry.pieces, BOARD_W, BOARD_H);
    dispatch({ type: 'add', text, hint });
  };

  return (
    <>
      <div className="goalbar">
        <h2>{goal.name}</h2>
        <span className="spacer" />
        <div className="tally"><b>{placed}</b> / {total} pieces placed</div>
      </div>

      <div className="board-grid">
        <div className="mat-slot">
          <PuzzleMat goal={goal} geometry={geometry} solved={solved} />
          {recutNote && <div className="recut-note"><span>{recutNote}</span></div>}
          {solved && <div className="solve-note"><span>Solved &middot; {total} pieces</span></div>}
        </div>

        <TaskPanel
          tasks={goal.tasks}
          onToggle={(id) => dispatch({ type: 'toggle', id })}
          onEdit={(id, text) => dispatch({ type: 'edit', id, text })}
          onRemove={(id) => dispatch({ type: 'remove', id })}
          onAdd={add}
          onReorder={(from, to) => dispatch({ type: 'reorder', from, to })}
        />
      </div>

      {/* Footer moved to App.jsx for archive/nav controls */}
    </>
  );
}
