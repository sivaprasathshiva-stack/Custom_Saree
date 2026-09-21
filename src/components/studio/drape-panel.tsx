"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { ApiError, apiGet, apiPost, pollJob } from "@/lib/api/client";

/**
 * See your saree draped (§19, §23, §24, §25).
 *
 * The model dominates the screen and the chrome stays out of the way (§24).
 * Rotation is frame-scrubbing over a pre-rendered sequence, which is why the
 * domain interface is mode-agnostic — swapping to a real 3D scene later does
 * not change this screen's contract (§19.4).
 */

interface Drape {
  id: string;
  style: string;
  mode: string;
  frames: string[];
  previewUrl: string | null;
}

interface DrapesResponse {
  styles: readonly string[];
  drapes: Drape[];
  pending: Array<{ id: string; style: string; status: string }>;
  disclaimer: string;
}

export function DrapePanel({
  designId,
  initialData,
}: {
  designId: string;
  initialData: DrapesResponse;
}) {
  // Rendered from server-loaded data, so the first paint already shows any
  // drape the customer has — no loading flash, no fetch-on-mount.
  const [data, setData] = useState<DrapesResponse>(initialData);
  const [style, setStyle] = useState<string | null>(
    initialData.drapes[0]?.style ?? initialData.styles[0] ?? null,
  );
  const [frame, setFrame] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; frame: number } | null>(null);

  const load = useCallback(async () => {
    const next = await apiGet<DrapesResponse>(`/api/studio/designs/${designId}/drapes`);
    setData(next);
    return next;
  }, [designId]);

  const active = data.drapes.find((drape) => drape.style === style) ?? null;

  const requestDrape = async (nextStyle: string) => {
    setStyle(nextStyle);
    setFrame(0);
    // Already generated for this concept — showing it is free and instant.
    if (data.drapes.some((drape) => drape.style === nextStyle)) return;

    setBusy(true);
    setError(null);
    try {
      const result = await apiPost<{ drapeId: string; jobId?: string; status: string }>(
        `/api/studio/designs/${designId}/drapes`,
        { style: nextStyle },
      );
      if (result.jobId) {
        const final = await pollJob(result.jobId);
        if (final.status !== "SUCCEEDED") {
          setError(final.error?.message ?? "We couldn't prepare that drape. Please try again.");
          return;
        }
      }
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "We couldn't prepare that drape.");
    } finally {
      setBusy(false);
    }
  };

  // Drag horizontally to rotate — the frame sequence is the rotation.
  const onPointerDown = (event: React.PointerEvent) => {
    if (!active || active.frames.length === 0) return;
    (event.target as Element).setPointerCapture?.(event.pointerId);
    dragRef.current = { x: event.clientX, frame };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !active || active.frames.length === 0) return;
    const delta = Math.round((event.clientX - drag.x) / 18);
    const count = active.frames.length;
    setFrame(((drag.frame + delta) % count + count) % count);
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const step = (direction: 1 | -1) => {
    if (!active || active.frames.length === 0) return;
    const count = active.frames.length;
    setFrame((current) => ((current + direction) % count + count) % count);
  };

  const preparing = busy || data.pending.some((entry) => entry.style === style);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col bg-ink text-paper">
      <div className="px-6 pt-8 text-center">
        <h1 className="font-display text-3xl">See your saree draped</h1>
        <p className="mt-2 text-sm text-gray-light">
          Explore how your woven concept could look when worn.
        </p>
      </div>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative flex flex-1 touch-none items-center justify-center overflow-hidden px-6 py-8"
      >
        {preparing && (
          <p aria-live="polite" className="font-mono text-xs uppercase tracking-[0.2em] text-gray-light">
            Preparing NILA…
          </p>
        )}

        {!preparing && active?.frames[frame] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active.frames[frame]}
            alt={`Your saree draped on NILA, ${active.style} style`}
            style={{ transform: `scale(${zoom})` }}
            className="max-h-[60vh] w-auto cursor-grab select-none transition-transform active:cursor-grabbing"
            draggable={false}
          />
        )}

        {!preparing && !active && !error && (
          <p className="text-sm text-gray-light">Choose a drape style to begin.</p>
        )}

        {error && (
          <div className="text-center">
            <p className="text-sm text-gray-light">{error}</p>
            <button
              type="button"
              onClick={() => style && void requestDrape(style)}
              className="mt-4 rounded-sm border border-paper/30 px-5 py-2.5 text-xs font-semibold"
            >
              Try Again
            </button>
          </div>
        )}

        {active && active.frames.length > 0 && !preparing && (
          <div className="absolute right-6 top-1/2 flex -translate-y-1/2 flex-col gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Rotate left"
              className="grid h-10 w-10 place-items-center rounded-full border border-paper/20 text-sm"
            >
              ↺
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Rotate right"
              className="grid h-10 w-10 place-items-center rounded-full border border-paper/20 text-sm"
            >
              ↻
            </button>
            <button
              type="button"
              onClick={() => setZoom((value) => Math.min(2.5, value + 0.25))}
              aria-label="Zoom in"
              className="grid h-10 w-10 place-items-center rounded-full border border-paper/20 text-sm"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoom((value) => Math.max(0.75, value - 0.25))}
              aria-label="Zoom out"
              className="grid h-10 w-10 place-items-center rounded-full border border-paper/20 text-sm"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setFrame(0);
              }}
              aria-label="Reset view"
              className="grid h-10 w-10 place-items-center rounded-full border border-paper/20 font-mono text-[9px]"
            >
              RESET
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2 px-6 pb-2">
        {data.styles.map((entry) => (
          <button
            key={entry}
            type="button"
            onClick={() => void requestDrape(entry)}
            disabled={busy}
            aria-pressed={entry === style}
            className={[
              "rounded-full border px-5 py-2 text-xs font-semibold transition disabled:opacity-40",
              entry === style ? "border-paper bg-paper text-ink" : "border-paper/25 text-paper",
            ].join(" ")}
          >
            {entry}
          </button>
        ))}
      </div>

      <div className="px-6 pb-6 pt-4 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-light">
          Digital drape concept
        </p>
        <p className="mx-auto mt-2 max-w-prose text-[11px] leading-relaxed text-gray">
          {data.disclaimer}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={`/studio/${designId}/woven`}
            className="rounded-sm border border-paper/25 px-5 py-3 text-sm font-semibold"
          >
            Back to concept
          </Link>
          <Link
            href={`/studio/${designId}/submit`}
            className="rounded-sm bg-paper px-6 py-3 text-sm font-semibold text-ink"
          >
            Send to VELVOREA →
          </Link>
        </div>
      </div>
    </div>
  );
}
