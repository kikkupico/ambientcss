/* Undo and redo for the builder's one piece of state.
 *
 *  A history entry is recorded once the state has stopped changing for a
 *  moment, not on every change: a slider fires on every pixel of a drag,
 *  and undo should take back the drag, not one pixel of it. */

import { useCallback, useEffect, useRef, useState } from "react";
import type { SetStateAction } from "react";

const LIMIT = 100;
const SETTLE_MS = 350;

export function useHistory<T>(initial: T | (() => T)) {
  const [state, setState] = useState<T>(initial);
  /** The last state that made it into history. */
  const anchor = useRef<T>(state);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  /* Refs hold the stacks so commits never re-render on their own; this
     counter is the one thing that does, so the buttons can enable. */
  const [, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  useEffect(() => {
    if (state === anchor.current) return;
    const timer = window.setTimeout(() => {
      past.current = [...past.current, anchor.current].slice(-LIMIT);
      future.current = [];
      anchor.current = state;
      bump();
    }, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  const set = useCallback((next: SetStateAction<T>) => setState(next), []);

  /* Undo and redo read and write refs rather than going through a state
     updater: StrictMode runs updaters twice in development, and an updater
     that pops a stack would pop it twice. */
  const live = useRef<T>(state);
  live.current = state;

  const go = (next: T) => {
    live.current = next;
    setState(next);
    bump();
  };

  const undo = useCallback(() => {
    const current = live.current;
    /* A change still settling is undone first, back to where it began. */
    if (current !== anchor.current) {
      future.current = [current, ...future.current];
      go(anchor.current);
      return;
    }
    const previous = past.current[past.current.length - 1];
    if (previous === undefined) return;
    past.current = past.current.slice(0, -1);
    future.current = [current, ...future.current];
    anchor.current = previous;
    go(previous);
  }, []);

  const redo = useCallback(() => {
    const next = future.current[0];
    if (next === undefined) return;
    future.current = future.current.slice(1);
    past.current = [...past.current, anchor.current].slice(-LIMIT);
    anchor.current = next;
    go(next);
  }, []);

  return {
    state,
    set,
    undo,
    redo,
    canUndo: past.current.length > 0 || state !== anchor.current,
    canRedo: future.current.length > 0
  };
}
