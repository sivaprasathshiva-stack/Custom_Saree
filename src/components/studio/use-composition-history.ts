"use client";

import { useCallback, useRef, useState } from "react";
import { MIN_HISTORY_DEPTH } from "@/config/limits";
import type { Composition } from "@/domain/composition";

/**
 * Undo/redo for the compose canvas (§10.4).
 *
 * Continuous gestures — dragging, scrubbing a slider — would otherwise push a
 * history entry per pointer move, so one undo would nudge an object a pixel.
 * `commit` opens a coalescing window keyed by a gesture id: every update in
 * the same gesture replaces the last entry rather than appending.
 */

export interface CompositionHistory {
  composition: Composition;
  canUndo: boolean;
  canRedo: boolean;
  /** Applies a change. `gestureId` coalesces a continuous interaction. */
  commit: (next: Composition, gestureId?: string) => void;
  undo: () => void;
  redo: () => void;
  reset: (next: Composition) => void;
  /** Replaces state without touching history — for loading from the server. */
  hydrate: (next: Composition) => void;
}

export function useCompositionHistory(initial: Composition): CompositionHistory {
  const [past, setPast] = useState<Composition[]>([]);
  const [present, setPresent] = useState<Composition>(initial);
  const [future, setFuture] = useState<Composition[]>([]);
  const activeGesture = useRef<string | null>(null);

  const commit = useCallback((next: Composition, gestureId?: string) => {
    setPresent((current) => {
      if (next === current) return current;

      const continuing = gestureId !== undefined && activeGesture.current === gestureId;
      activeGesture.current = gestureId ?? null;

      if (!continuing) {
        // A new discrete action: push the outgoing state onto the undo stack.
        setPast((stack) => {
          const appended = [...stack, current];
          return appended.length > MIN_HISTORY_DEPTH
            ? appended.slice(appended.length - MIN_HISTORY_DEPTH)
            : appended;
        });
        setFuture([]);
      }

      return next;
    });
  }, []);

  const undo = useCallback(() => {
    activeGesture.current = null;
    setPast((stack) => {
      if (stack.length === 0) return stack;
      const previous = stack[stack.length - 1];
      setPresent((current) => {
        setFuture((forward) => [current, ...forward]);
        return previous;
      });
      return stack.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    activeGesture.current = null;
    setFuture((stack) => {
      if (stack.length === 0) return stack;
      const [next, ...rest] = stack;
      setPresent((current) => {
        setPast((backward) => [...backward, current]);
        return next;
      });
      return rest;
    });
  }, []);

  const reset = useCallback((next: Composition) => {
    // Reset is itself undoable — clearing the canvas by accident must not be
    // the one action a customer cannot take back.
    activeGesture.current = null;
    setPresent((current) => {
      setPast((stack) => [...stack, current]);
      setFuture([]);
      return next;
    });
  }, []);

  const hydrate = useCallback((next: Composition) => {
    activeGesture.current = null;
    setPresent(next);
    setPast([]);
    setFuture([]);
  }, []);

  return {
    composition: present,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    commit,
    undo,
    redo,
    reset,
    hydrate,
  };
}
