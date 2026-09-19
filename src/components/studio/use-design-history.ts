"use client";

import { useCallback, useReducer, useRef } from "react";
import {
  designReducer,
  HISTORY_SIGNIFICANT_ACTIONS,
  type DesignAction,
} from "./design-reducer";
import type { SareeDesign } from "./types";

interface HistoryState {
  past: SareeDesign[];
  present: SareeDesign;
  future: SareeDesign[];
}

type HistoryAction =
  | { type: "DISPATCH"; action: DesignAction }
  | { type: "COMMIT_CHECKPOINT"; checkpoint: SareeDesign }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET"; design: SareeDesign };

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case "DISPATCH": {
      const next = designReducer(state.present, action.action);
      if (next === state.present) return state;
      // Continuous transforms (drag/scale/rotate ticks) update the present
      // without pushing a new history entry each frame; the caller commits
      // a history checkpoint on drag-end via COMMIT.
      if (!HISTORY_SIGNIFICANT_ACTIONS.has(action.action.type)) {
        return { ...state, present: next };
      }
      return { past: [...state.past, state.present], present: next, future: [] };
    }
    case "COMMIT_CHECKPOINT":
      return { past: [...state.past, action.checkpoint], present: state.present, future: [] };
    case "UNDO": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case "REDO": {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return { past: [...state.past, state.present], present: next, future: rest };
    }
    case "RESET":
      return { past: [], present: action.design, future: [] };
    default:
      return state;
  }
}

export function useDesignHistory(initial: SareeDesign) {
  const [state, dispatchHistory] = useReducer(historyReducer, {
    past: [],
    present: initial,
    future: [],
  });

  // For coalesced actions (drag/scale/rotate), snapshot the pre-drag state
  // once, then commit it as a single history entry on drag-end.
  const checkpointRef = useRef<SareeDesign | null>(null);

  const dispatch = useCallback((action: DesignAction) => {
    dispatchHistory({ type: "DISPATCH", action });
  }, []);

  const beginTransformCheckpoint = useCallback((current: SareeDesign) => {
    checkpointRef.current = current;
  }, []);

  const commitTransformCheckpoint = useCallback(() => {
    const checkpoint = checkpointRef.current;
    checkpointRef.current = null;
    if (!checkpoint) return;
    // Pushes the pre-drag snapshot onto `past` and keeps the current
    // (post-drag) present untouched, so undo steps back to before the drag
    // without visually reverting anything right now.
    dispatchHistory({ type: "COMMIT_CHECKPOINT", checkpoint });
  }, []);

  const undo = useCallback(() => dispatchHistory({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatchHistory({ type: "REDO" }), []);
  const reset = useCallback(
    (design: SareeDesign) => dispatchHistory({ type: "RESET", design }),
    []
  );

  return {
    design: state.present,
    dispatch,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    reset,
    beginTransformCheckpoint,
    commitTransformCheckpoint,
  };
}
