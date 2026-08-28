// The goal document and every transition it can make. Pure — no DOM, no React —
// so the rules stay testable on their own.
import { hash, uid } from './rng.js';
import { fitCut, tileCount } from './cuts.js';
import { deal, borrowTileFor, absorbTiles } from './tiles.js';

export const SCHEMA = 1;

export function createGoal({ name, steps, img, template }) {
  const cut = fitCut(template.cols, template.rows, steps.length);
  const tasks = steps.map((text) => ({ id: uid(), text, done: false, tiles: [] }));
  return {
    schema: SCHEMA,
    name,
    img,
    cols: cut.cols,
    rows: cut.rows,
    seed: hash(`${name}|${steps.length}|${Date.now()}`),
    startHint: null,
    tasks: deal(tasks, tileCount(cut)),
  };
}

export const pieceTotal = (g) => g.cols * g.rows;

/**
 * Add a step. If the cut can no longer hold every step it climbs the ladder and
 * redeals; otherwise the new step borrows a spare tile, which is what keeps the
 * promise that adding work never takes a placed tile back off the board.
 * `hint` is only used on a re-cut, to reopen the same part of the picture.
 */
export function addTask(goal, text, hint) {
  const t = { id: uid(), text, done: false, tiles: [] };
  const tasks = [...goal.tasks, t];
  const cut = fitCut(goal.cols, goal.rows, tasks.length);

  if (cut.cols !== goal.cols || cut.rows !== goal.rows) {
    return {
      ...goal,
      cols: cut.cols,
      rows: cut.rows,
      startHint: hint ?? goal.startHint,
      tasks: deal(tasks, tileCount(cut)),
    };
  }
  return { ...goal, tasks: borrowTileFor(tasks, t.id) };
}

export function toggleTask(goal, id) {
  return { ...goal, tasks: goal.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) };
}

export function editTask(goal, id, text) {
  return { ...goal, tasks: goal.tasks.map((t) => (t.id === id ? { ...t, text } : t)) };
}

/** Move a step from one position to another. Tiles stay with their step. */
export function reorderTask(goal, fromIndex, toIndex) {
  if (fromIndex === toIndex) return goal;
  const tasks = [...goal.tasks];
  const [moved] = tasks.splice(fromIndex, 1);
  tasks.splice(toIndex, 0, moved);
  return { ...goal, tasks };
}

/** Removing a step hands its tiles to a neighbour. The cut never shrinks back. */
export function removeTask(goal, id) {
  const i = goal.tasks.findIndex((t) => t.id === id);
  if (i < 0) return goal;
  const orphaned = goal.tasks[i].tiles || [];
  const rest = goal.tasks.filter((t) => t.id !== id);
  return { ...goal, tasks: absorbTiles(rest, i, orphaned) };
}

export function reducer(goal, action) {
  switch (action.type) {
    case 'create': return createGoal(action.payload);
    case 'add':    return addTask(goal, action.text, action.hint);
    case 'toggle': return toggleTask(goal, action.id);
    case 'edit':    return editTask(goal, action.id, action.text);
    case 'reorder': return reorderTask(goal, action.from, action.to);
    case 'remove':  return removeTask(goal, action.id);
    case 'reset':  return null;
    default:       return goal;
  }
}
