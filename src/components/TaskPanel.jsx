import { useRef, useState } from 'react';

const PieceTick = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path className="sil" d="M2 2h5.2c0 1.3-.9 1.1-.9 2.2S7.5 5.8 8.6 5.8 10.9 5.3 10.9 4.2 10 4.4 10 2H18v5.6c-1.3 0-1.1-.9-2.2-.9s-1.6 1.2-1.6 2.3.5 2.3 1.6 2.3 1-.9 2.2-.9V18h-5.6c0-1.3.9-1.1.9-2.2s-1.2-1.6-2.3-1.6-2.3.5-2.3 1.6.9 1 .9 2.2H2z" />
  </svg>
);

export default function TaskPanel({ tasks, onToggle, onEdit, onRemove, onAdd, onReorder }) {
  const [draft, setDraft] = useState('');
  const pad = tasks.length >= 10 ? 2 : 1;
  const done = tasks.filter((t) => t.done).length;

  const listRef = useRef(null);
  const dragRef = useRef(null);   // { fromIndex, overIndex } — ref so pointerUp always sees latest
  const [dragFromIndex, setDragFromIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const submit = (e) => {
    if (e.key !== 'Enter') return;
    const v = draft.trim();
    if (!v) return;
    setDraft('');
    onAdd(v);
  };

  const getItemIndex = (y) => {
    if (!listRef.current) return -1;
    const items = [...listRef.current.children];
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      if (y < rect.top + rect.height / 2) return i;
    }
    return items.length - 1;
  };

  const onPointerDown = (e, index) => {
    if (!e.target.closest('.drag-handle')) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { fromIndex: index, overIndex: index };
    setDragFromIndex(index);
    setDragOverIndex(index);
  };

  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const over = getItemIndex(e.clientY);
    if (over !== dragRef.current.overIndex) {
      dragRef.current.overIndex = over;
      setDragOverIndex(over);
    }
  };

  const onPointerUp = () => {
    if (!dragRef.current) return;
    const { fromIndex, overIndex } = dragRef.current;
    dragRef.current = null;
    setDragFromIndex(null);
    setDragOverIndex(null);
    if (fromIndex !== overIndex) {
      onReorder(fromIndex, overIndex);
    }
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="eyebrow">Steps</span>
        <span className="spacer" />
        <span className="tally">{done} of {tasks.length} done</span>
      </div>

      <ul className="tasks" ref={listRef}>
        {tasks.map((t, i) => {
          const owned = (t.tiles || []).length;
          const isDragging = dragFromIndex === i;
          const isOver = dragFromIndex != null && dragOverIndex === i && dragFromIndex !== i;
          return (
            <li
              className={
                `task${t.done ? ' done' : ''}${owned ? '' : ' shared'}`
                + `${isDragging ? ' dragging' : ''}${isOver ? ' drop-target' : ''}`
              }
              key={t.id}
              onPointerDown={(e) => onPointerDown(e, i)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              <span className="drag-handle" aria-hidden="true" style={{ touchAction: 'none' }}>&#x2261;</span>
              <span
                className="num mono"
                title={owned > 1 ? `${owned} tiles`
                  : owned ? undefined
                  : 'No tile of its own \u2014 the cut is already at its finest'}
              >
                {String(i + 1).padStart(pad, '0')}
              </span>
              <button
                className="tick"
                type="button"
                aria-pressed={t.done}
                aria-label={`${t.done ? 'Undo' : 'Complete'}: ${t.text}`}
                onClick={() => onToggle(t.id)}
              >
                <PieceTick />
              </button>
              <input
                className="t"
                value={t.text}
                aria-label={`Step ${i + 1}`}
                onChange={(e) => onEdit(t.id, e.target.value)}
              />
              <button
                className="x"
                type="button"
                title="Remove step"
                aria-label={`Remove step: ${t.text}`}
                onClick={() => onRemove(t.id)}
              >
                &times;
              </button>
            </li>
          );
        })}
      </ul>

      <div className="addrow">
        <span className="plus" aria-hidden="true">+</span>
        <input
          placeholder="Add a step"
          aria-label="Add a step"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={submit}
        />
      </div>
    </div>
  );
}
