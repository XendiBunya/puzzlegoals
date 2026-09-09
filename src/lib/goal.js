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

/** Whether a task is effectively complete (all subtasks done, or no subtasks and manually done). */
export function isTaskDone(t) {
  if (t.subtasks?.length) return t.subtasks.every((s) => s.done);
  return !!t.done;
}

/** Completion units: each subtask counts as 1; tasks without subtasks count as 1. */
export function completionUnits(tasks) {
  let total = 0, done = 0;
  for (const t of tasks) {
    if (t.subtasks?.length) {
      total += t.subtasks.length;
      done += t.subtasks.filter((s) => s.done).length;
    } else {
      total += 1;
      done += t.done ? 1 : 0;
    }
  }
  return { total, done };
}

export function toggleTask(goal, id) {
  return {
    ...goal,
    tasks: goal.tasks.map((t) => {
      if (t.id !== id) return t;
      if (t.subtasks?.length) {
        const allDone = t.subtasks.every((s) => s.done);
        const subtasks = t.subtasks.map((s) => ({ ...s, done: !allDone }));
        return { ...t, subtasks, done: !allDone };
      }
      return { ...t, done: !t.done };
    }),
  };
}

export function addSubtask(goal, taskId, text) {
  return {
    ...goal,
    tasks: goal.tasks.map((t) => {
      if (t.id !== taskId) return t;
      const subtasks = [...(t.subtasks || []), { id: uid(), text, done: false }];
      return { ...t, subtasks, done: false };
    }),
  };
}

export function toggleSubtask(goal, taskId, subtaskId) {
  return {
    ...goal,
    tasks: goal.tasks.map((t) => {
      if (t.id !== taskId) return t;
      const subtasks = (t.subtasks || []).map((s) =>
        s.id === subtaskId ? { ...s, done: !s.done } : s
      );
      return { ...t, subtasks, done: subtasks.every((s) => s.done) };
    }),
  };
}

export function editSubtask(goal, taskId, subtaskId, text) {
  return {
    ...goal,
    tasks: goal.tasks.map((t) => {
      if (t.id !== taskId) return t;
      return { ...t, subtasks: (t.subtasks || []).map((s) => s.id === subtaskId ? { ...s, text } : s) };
    }),
  };
}

export function reorderSubtask(goal, taskId, fromIndex, toIndex) {
  if (fromIndex === toIndex) return goal;
  return {
    ...goal,
    tasks: goal.tasks.map((t) => {
      if (t.id !== taskId) return t;
      const subtasks = [...(t.subtasks || [])];
      const [moved] = subtasks.splice(fromIndex, 1);
      subtasks.splice(toIndex, 0, moved);
      return { ...t, subtasks };
    }),
  };
}

export function removeSubtask(goal, taskId, subtaskId) {
  return {
    ...goal,
    tasks: goal.tasks.map((t) => {
      if (t.id !== taskId) return t;
      const subtasks = (t.subtasks || []).filter((s) => s.id !== subtaskId);
      if (!subtasks.length) return { ...t, subtasks: [], done: t.done };
      return { ...t, subtasks, done: subtasks.every((s) => s.done) };
    }),
  };
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

export function renameGoal(goal, name) {
  return { ...goal, name };
}

export function reducer(goal, action) {
  switch (action.type) {
    case 'create':          return createGoal(action.payload);
    case 'rename':          return renameGoal(goal, action.name);
    case 'add':             return addTask(goal, action.text, action.hint);
    case 'toggle':          return toggleTask(goal, action.id);
    case 'edit':            return editTask(goal, action.id, action.text);
    case 'reorder':         return reorderTask(goal, action.from, action.to);
    case 'remove':          return removeTask(goal, action.id);
    case 'addSubtask':      return addSubtask(goal, action.taskId, action.text);
    case 'toggleSubtask':   return toggleSubtask(goal, action.taskId, action.subtaskId);
    case 'editSubtask':     return editSubtask(goal, action.taskId, action.subtaskId, action.text);
    case 'reorderSubtask':  return reorderSubtask(goal, action.taskId, action.from, action.to);
    case 'removeSubtask':   return removeSubtask(goal, action.taskId, action.subtaskId);
    case 'reset':           return null;
    default:                return goal;
  }
}
