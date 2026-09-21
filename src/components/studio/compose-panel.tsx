"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AUTOSAVE_DEBOUNCE_MS, MAX_TEXT_LENGTH } from "@/config/limits";
import {
  addObject,
  type Composition,
  createImageObject,
  createTextObject,
  deleteObject,
  isEmpty,
  moveObject,
  rotateObject,
  scaleObject,
  updateText,
} from "@/domain/composition";
import { ApiError, apiPost, apiPut, apiUpload } from "@/lib/api/client";
import { SareeCanvas } from "./saree-canvas";
import { useCompositionHistory } from "./use-composition-history";

/**
 * Make it yours (§9, §10, §11, §12, §14.1).
 *
 * Autosave is continuous and its state is always visible (§46) — the customer
 * should never wonder whether their work is safe. A failed save surfaces a
 * retry rather than silently dropping the change (§2.5).
 */

type SaveState = "idle" | "saving" | "saved" | "failed";

interface IdeaAsset {
  id: string;
  url: string | null;
}

interface Suggestion {
  id: string;
  label: string;
  reason: string;
  objects: Record<string, { x: number; y: number; scale: number; rotation: number }>;
}

interface WeaveWarning {
  objectId: string;
  severity: "info" | "warning";
  message: string;
}

export function ComposePanel({
  designId,
  backgroundUrl,
  initialComposition,
  initialIdeaAsset,
  analysisReady,
}: {
  designId: string;
  backgroundUrl: string | null;
  initialComposition: Composition;
  initialIdeaAsset: IdeaAsset | null;
  analysisReady: boolean;
}) {
  const router = useRouter();
  const history = useCompositionHistory(initialComposition);
  const { composition } = history;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ideaAsset, setIdeaAsset] = useState<IdeaAsset | null>(initialIdeaAsset);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [warnings, setWarnings] = useState<WeaveWarning[] | null>(null);
  const [proposed, setProposed] = useState<Composition | null>(null);
  const [busy, setBusy] = useState<null | "arrange" | "optimize" | "generate" | "upload">(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const savedRef = useRef<string>(JSON.stringify(initialComposition));
  const selected = composition.objects.find((object) => object.id === selectedId) ?? null;
  const textObject = composition.objects.find((object) => object.type === "text") ?? null;

  const save = useCallback(
    async (next: Composition) => {
      const serialized = JSON.stringify(next);
      if (serialized === savedRef.current) return;

      setSaveState("saving");
      try {
        await apiPut(`/api/studio/designs/${designId}/composition`, { composition: next });
        savedRef.current = serialized;
        setSaveState("saved");
      } catch (caught) {
        setSaveState("failed");
        setError(caught instanceof ApiError ? caught.message : "We couldn't save that change.");
      }
    },
    [designId],
  );

  // Debounced autosave (§46.1).
  useEffect(() => {
    const timer = setTimeout(() => void save(composition), AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [composition, save]);

  // Also save when the tab is hidden or closed, so work in the debounce
  // window survives someone navigating away mid-edit (§46.1).
  useEffect(() => {
    const flush = () => {
      if (JSON.stringify(composition) !== savedRef.current) void save(composition);
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, [composition, save]);

  const addImage = async (file: File) => {
    setBusy("upload");
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("type", "IDEA_IMAGE");
      const result = await apiUpload<{ asset: IdeaAsset }>(
        `/api/studio/designs/${designId}/assets`,
        form,
      );
      setIdeaAsset(result.asset);
      const object = createImageObject({ id: crypto.randomUUID(), assetId: result.asset.id });
      history.commit(addObject(composition, object));
      setSelectedId(object.id);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "That image couldn't be added.");
    } finally {
      setBusy(null);
    }
  };

  const addText = () => {
    const object = createTextObject({ id: crypto.randomUUID(), text: "Your words" });
    history.commit(addObject(composition, object));
    setSelectedId(object.id);
  };

  const runSmartArrange = async () => {
    setBusy("arrange");
    setError(null);
    try {
      const result = await apiPost<{ suggestions: Suggestion[] }>(
        `/api/studio/designs/${designId}/smart-arrange`,
      );
      setSuggestions(result.suggestions);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Couldn't suggest a placement.");
    } finally {
      setBusy(null);
    }
  };

  /** Applying a suggestion is an ordinary edit, so undo takes it back (§11.4). */
  const applySuggestion = (suggestion: Suggestion) => {
    let next = composition;
    for (const [objectId, placement] of Object.entries(suggestion.objects)) {
      next = moveObject(next, objectId, placement.x, placement.y);
      next = scaleObject(next, objectId, placement.scale);
      next = rotateObject(next, objectId, placement.rotation);
    }
    history.commit(next);
    setSuggestions(null);
  };

  const runOptimize = async () => {
    setBusy("optimize");
    setError(null);
    try {
      const result = await apiPost<{
        warnings: WeaveWarning[];
        proposed: Composition;
        alreadyOptimal: boolean;
      }>(`/api/studio/designs/${designId}/optimize`);
      setWarnings(result.warnings);
      setProposed(result.alreadyOptimal ? null : result.proposed);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Couldn't check this design.");
    } finally {
      setBusy(null);
    }
  };

  const generate = async () => {
    setBusy("generate");
    setError(null);
    try {
      // Flush any pending edit first, so the job pins what is on screen.
      await save(composition);
      const result = await apiPost<{ jobId: string }>(
        `/api/studio/designs/${designId}/woven-concepts`,
      );
      router.push(`/studio/${designId}/woven?job=${result.jobId}`);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "We couldn't start your woven concept.",
      );
      setBusy(null);
    }
  };

  const canGenerate = !isEmpty(composition) && busy === null;

  return (
    <div className="mx-auto max-w-5xl px-5 pb-28 pt-8 sm:px-6 sm:pb-10 sm:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2rem] leading-tight sm:text-3xl">Make it yours</h1>
          <p className="mt-2 text-sm text-gray">
            Move your image and words wherever you&apos;d like them on the saree.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={history.undo}
            disabled={!history.canUndo}
            className="rounded-sm border border-line px-3 py-2 text-xs font-semibold transition enabled:hover:border-ink disabled:opacity-40"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={history.redo}
            disabled={!history.canRedo}
            className="rounded-sm border border-line px-3 py-2 text-xs font-semibold transition enabled:hover:border-ink disabled:opacity-40"
          >
            Redo
          </button>
          <button
            type="button"
            onClick={() => {
              history.reset({ ...composition, objects: [] });
              setSelectedId(null);
            }}
            disabled={isEmpty(composition)}
            className="rounded-sm border border-line px-3 py-2 text-xs font-semibold transition enabled:hover:border-ink disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <SareeCanvas
            composition={composition}
            backgroundUrl={backgroundUrl}
            selectedId={selectedId}
            imageUrlFor={(assetId) => (ideaAsset?.id === assetId ? ideaAsset.url : null)}
            onSelect={setSelectedId}
            onChange={(next, gestureId) => history.commit(next, gestureId)}
            onDelete={(objectId) => {
              history.commit(deleteObject(composition, objectId));
              setSelectedId(null);
            }}
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <p aria-live="polite" className="text-xs text-gray">
              {saveState === "saving" && "Saving…"}
              {saveState === "saved" && "Saved"}
              {saveState === "failed" && (
                <span className="text-danger">
                  Not saved.{" "}
                  <button type="button" onClick={() => void save(composition)} className="underline">
                    Retry
                  </button>
                </span>
              )}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-gray-light">
              Digital textile concept preview
            </p>
          </div>

          {selected && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-sm border border-line p-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray">
                {selected.type === "text" ? "Text" : "Image"}
              </span>
              <span className="text-xs text-gray">Drag to move · handles to resize and rotate</span>
              <button
                type="button"
                onClick={() => {
                  history.commit(deleteObject(composition, selected.id));
                  setSelectedId(null);
                }}
                className="ml-auto rounded-sm border border-line px-3 py-1.5 text-xs font-semibold text-danger transition hover:border-danger"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-sm border border-line p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray">
              Add your idea
            </h2>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              id="idea-image"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void addImage(file);
                event.target.value = "";
              }}
            />

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={ideaAsset !== null || busy === "upload"}
                className="flex-1 rounded-sm border border-line px-3 py-2.5 text-xs font-semibold transition enabled:hover:border-ink disabled:opacity-40"
              >
                {busy === "upload" ? "Adding…" : ideaAsset ? "Image added" : "+ Add image"}
              </button>
              <button
                type="button"
                onClick={addText}
                disabled={textObject !== null}
                className="flex-1 rounded-sm border border-line px-3 py-2.5 text-xs font-semibold transition enabled:hover:border-ink disabled:opacity-40"
              >
                {textObject ? "Text added" : "+ Add text"}
              </button>
            </div>

            {textObject?.type === "text" && (
              <div className="mt-4">
                <label htmlFor="saree-text" className="text-xs font-medium text-gray">
                  Your words
                </label>
                <input
                  id="saree-text"
                  value={textObject.text}
                  maxLength={MAX_TEXT_LENGTH}
                  onChange={(event) =>
                    history.commit(
                      updateText(composition, textObject.id, event.target.value),
                      `text:${textObject.id}`,
                    )
                  }
                  className="mt-1.5 w-full rounded-sm border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
                <p className="mt-1 text-right font-mono text-[10px] text-gray">
                  {textObject.text.length} / {MAX_TEXT_LENGTH} characters
                </p>
              </div>
            )}
          </section>

          <section className="rounded-sm border border-line p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray">
              Smart Arrange
            </h2>
            <button
              type="button"
              onClick={runSmartArrange}
              disabled={isEmpty(composition) || busy !== null || !analysisReady}
              className="mt-3 w-full rounded-sm border border-line px-3 py-2.5 text-xs font-semibold transition enabled:hover:border-ink disabled:opacity-40"
            >
              {busy === "arrange" ? "Looking…" : "Suggest a placement"}
            </button>
            {!analysisReady && (
              <p className="mt-2 text-[11px] text-gray">
                Available once we&apos;ve finished reading your saree.
              </p>
            )}

            {suggestions && suggestions.length > 0 && (
              <ul className="mt-3 space-y-2">
                {suggestions.map((suggestion) => (
                  <li key={suggestion.id}>
                    <button
                      type="button"
                      onClick={() => applySuggestion(suggestion)}
                      className="w-full rounded-sm border border-line p-3 text-left transition hover:border-ink"
                    >
                      <span className="block text-xs font-semibold">{suggestion.label}</span>
                      <span className="mt-0.5 block text-[11px] text-gray">{suggestion.reason}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-sm border border-line p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray">
              Weaving check
            </h2>
            <button
              type="button"
              onClick={runOptimize}
              disabled={isEmpty(composition) || busy !== null}
              className="mt-3 w-full rounded-sm border border-line px-3 py-2.5 text-xs font-semibold transition enabled:hover:border-ink disabled:opacity-40"
            >
              {busy === "optimize" ? "Checking…" : "Optimize for weaving"}
            </button>

            {warnings && warnings.length === 0 && (
              <p className="mt-3 text-[11px] text-success">This design should weave well.</p>
            )}

            {warnings && warnings.length > 0 && (
              <>
                <ul className="mt-3 space-y-1.5">
                  {warnings.map((warning, index) => (
                    <li key={`${warning.objectId}-${index}`} className="text-[11px] text-gray">
                      {warning.message}
                    </li>
                  ))}
                </ul>
                {proposed && (
                  <button
                    type="button"
                    onClick={() => {
                      history.commit(proposed);
                      setProposed(null);
                      setWarnings([]);
                    }}
                    className="mt-3 w-full rounded-sm bg-ink px-3 py-2.5 text-xs font-semibold text-paper"
                  >
                    Apply suggestion
                  </button>
                )}
              </>
            )}

            <p className="mt-3 text-[10px] leading-relaxed text-gray-light">
              This optimization is a visual guidance step. Final production feasibility will be
              determined during VELVOREA&apos;s technical review.
            </p>
          </section>
        </aside>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-sm border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      {/* Pinned on a phone: the sidebar stacks below a tall canvas, so an
          in-flow action bar would sit far below the fold. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur sm:static sm:mt-10 sm:border-t sm:bg-transparent sm:px-0 sm:pt-6 sm:backdrop-blur-none">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p className="hidden text-xs text-gray sm:block">
            {isEmpty(composition)
              ? "Add an image or some words to continue."
              : "Your design is saved automatically."}
          </p>
          <button
            type="button"
            onClick={generate}
            disabled={!canGenerate}
            className="ml-auto rounded-sm bg-ink px-6 py-3.5 text-sm font-semibold text-paper transition-colors enabled:hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "generate" ? "Starting…" : "Create Woven Concept →"}
          </button>
        </div>
      </div>
    </div>
  );
}
