import { useEffect, useRef, useState } from 'react';
import PuzzleMat, { useGeometry } from './PuzzleMat.jsx';
import TaskPanel from './TaskPanel.jsx';
import { pieceTotal, completionUnits } from '../lib/goal.js';
import { revealedTiles, revealHint } from '../lib/tiles.js';
import { BOARD_W, BOARD_H } from '../lib/jigsaw.js';

export default function Board({ goal, dispatch }) {
  const geometry = useGeometry(goal);
  const total = pieceTotal(goal);
  const placed = revealedTiles(goal.tasks).size;
  const solved = placed === total && total > 0;
  const cu = completionUnits(goal.tasks);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal.name);
  const inputRef = useRef(null);

  const startEditing = () => {
    setDraft(goal.name);
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const commitRename = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== goal.name) {
      dispatch({ type: 'rename', name: trimmed });
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') setEditing(false);
  };

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
        {editing ? (
          <input
            ref={inputRef}
            className="goal-name-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={onKeyDown}
          />
        ) : (
          <h2 className="goal-name-editable" onClick={startEditing} title="Click to rename">{goal.name}</h2>
        )}
        <span className="spacer" />
        <div className="tally"><b>{placed}</b> / {total} pieces &middot; {Math.round((cu.done / cu.total) * 100 || 0)}%</div>
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
          onAddSubtask={(taskId, text) => dispatch({ type: 'addSubtask', taskId, text })}
          onToggleSubtask={(taskId, subtaskId) => dispatch({ type: 'toggleSubtask', taskId, subtaskId })}
          onEditSubtask={(taskId, subtaskId, text) => dispatch({ type: 'editSubtask', taskId, subtaskId, text })}
          onRemoveSubtask={(taskId, subtaskId) => dispatch({ type: 'removeSubtask', taskId, subtaskId })}
        />
      </div>

      {/* Footer moved to App.jsx for archive/nav controls */}
    </>
  );
}
