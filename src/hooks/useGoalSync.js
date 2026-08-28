import { useCallback, useEffect, useRef, useState } from 'react';
import { reducer } from '../lib/goal.js';
import { patchGoal } from '../lib/api.js';

/**
 * Replaces useReducer + useEffect(saveGoal) with optimistic server sync.
 * Components still receive { goal, dispatch } — nothing changes downstream.
 */
export function useGoalSync(initial) {
  const [goal, setGoal] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const goalRef = useRef(goal);
  goalRef.current = goal;

  // When initial changes (e.g. navigating to a different goal), reset
  useEffect(() => { setGoal(initial); }, [initial]);

  const dispatch = useCallback(async (action) => {
    const prev = goalRef.current;
    if (!prev) return;

    // Apply optimistically
    const next = reducer(prev, action);
    if (!next || next === prev) return;
    setGoal(next);
    setError(null);
    setSaving(true);

    try {
      const { goal: saved } = await patchGoal(prev.id, action);
      setGoal(saved);
    } catch (err) {
      // Roll back on failure
      setGoal(prev);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, []);

  return { goal, dispatch, saving, error };
}
