"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_SAREE_IMAGES } from "@/config/limits";
import { ApiError, apiGet, apiUpload } from "@/lib/api/client";

/**
 * Upload your saree (§8).
 *
 * Every state §8.3 lists is represented: empty, uploading, uploaded,
 * analysing, ready and failed — including per-file failure with a retry that
 * does not disturb the files that already succeeded.
 */

interface AssetSummary {
  id: string;
  type: string;
  url: string | null;
  originalFilename: string | null;
}

interface AnalysisSummary {
  status: string;
  ready: boolean;
  photoCount: number;
  detected: Record<string, boolean> | null;
  advisories: string[];
  message: string | null;
}

interface PendingUpload {
  key: string;
  name: string;
  previewUrl: string;
  error: string | null;
  file: File;
}

const CHECKLIST: Array<{ key: string; label: string }> = [
  { key: "saree", label: "Saree detected" },
  { key: "colour", label: "Colour identified" },
  { key: "border", label: "Border identified" },
  { key: "pallu", label: "Pallu identified" },
  { key: "pattern", label: "Pattern detected" },
];

export function UploadPanel({
  designId,
  initialAssets,
}: {
  designId: string;
  initialAssets: AssetSummary[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [assets, setAssets] = useState<AssetSummary[]>(initialAssets);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const sareeAssets = assets.filter((asset) => asset.type === "SAREE_REFERENCE");
  const slotsLeft = MAX_SAREE_IMAGES - sareeAssets.length - pending.length;
  const canContinue = sareeAssets.length > 0;

  // Object URLs for local previews must be released or they leak for the
  // lifetime of the page.
  useEffect(() => {
    return () => {
      for (const item of pending) URL.revokeObjectURL(item.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshAnalysis = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const next = await apiGet<AnalysisSummary>(
          `/api/studio/designs/${designId}/analysis`,
          signal,
        );
        setAnalysis(next);
        return next;
      } catch {
        return null;
      }
    },
    [designId],
  );

  // Poll while analysis is in flight. Stops as soon as it settles, so an idle
  // page makes no requests.
  useEffect(() => {
    if (sareeAssets.length === 0) return;
    if (analysis?.ready) return;

    const controller = new AbortController();
    let cancelled = false;

    const tick = async () => {
      const next = await refreshAnalysis(controller.signal);
      if (cancelled) return;
      if (!next?.ready && next?.status !== "FAILED") {
        timer = setTimeout(tick, 1800);
      }
    };

    let timer = setTimeout(tick, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [sareeAssets.length, analysis?.ready, analysis?.status, refreshAnalysis]);

  const uploadOne = useCallback(
    async (item: PendingUpload) => {
      const form = new FormData();
      form.set("file", item.file);
      form.set("type", "SAREE_REFERENCE");

      try {
        const result = await apiUpload<{ asset: AssetSummary }>(
          `/api/studio/designs/${designId}/assets`,
          form,
        );
        setAssets((current) => [...current, result.asset]);
        setPending((current) => current.filter((entry) => entry.key !== item.key));
        URL.revokeObjectURL(item.previewUrl);
        // A new photograph re-runs analysis, so clear the settled result.
        setAnalysis(null);
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "That upload didn't work. Please try again.";
        setPending((current) =>
          current.map((entry) => (entry.key === item.key ? { ...entry, error: message } : entry)),
        );
      }
    },
    [designId],
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      setNotice(null);
      const incoming = Array.from(files);
      const available = MAX_SAREE_IMAGES - sareeAssets.length - pending.length;

      if (available <= 0) {
        setNotice(`You've added the maximum of ${MAX_SAREE_IMAGES} photos.`);
        return;
      }
      if (incoming.length > available) {
        setNotice(`Only ${available} more photo${available === 1 ? "" : "s"} can be added.`);
      }

      const accepted = incoming.slice(0, available).map((file) => ({
        key: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        error: null,
        file,
      }));

      setPending((current) => [...current, ...accepted]);
      for (const item of accepted) void uploadOne(item);
    },
    [pending.length, sareeAssets.length, uploadOne],
  );

  const removePending = (key: string) => {
    setPending((current) => {
      const item = current.find((entry) => entry.key === key);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return current.filter((entry) => entry.key !== key);
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl">Start with your saree</h1>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-gray">
        Upload up to {MAX_SAREE_IMAGES} photographs of the saree you&apos;d like to customise. One
        is enough to begin.
      </p>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files);
        }}
        className={[
          "mt-8 rounded-sm border border-dashed p-10 text-center transition",
          dragging ? "border-ink bg-paper-dim" : "border-gray-light",
          slotsLeft <= 0 ? "opacity-50" : "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          id="saree-upload"
          disabled={slotsLeft <= 0}
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <label
          htmlFor="saree-upload"
          className="cursor-pointer text-sm font-semibold underline decoration-gray-light underline-offset-4 hover:decoration-ink"
        >
          Add saree photo
        </label>
        <p className="mt-2 text-xs text-gray">Drag &amp; drop, or browse</p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-gray-light">
          JPG · PNG · WebP
        </p>
      </div>

      {notice && (
        <p role="status" className="mt-3 text-xs text-warning">
          {notice}
        </p>
      )}

      {(sareeAssets.length > 0 || pending.length > 0) && (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {sareeAssets.map((asset) => (
            <li key={asset.id} className="relative">
              <div className="relative aspect-square overflow-hidden rounded-sm border border-line bg-paper-dim">
                {asset.url && (
                  <Image
                    src={asset.url}
                    alt={asset.originalFilename ?? "Saree photograph"}
                    fill
                    sizes="(max-width: 640px) 50vw, 200px"
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>
              <p className="mt-1.5 truncate text-[11px] text-gray">
                {asset.originalFilename ?? "Photo"}
              </p>
            </li>
          ))}

          {pending.map((item) => (
            <li key={item.key} className="relative">
              <div className="relative aspect-square overflow-hidden rounded-sm border border-line bg-paper-dim">
                {/* Local preview — not yet a stored asset, so not next/image. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt=""
                  className="h-full w-full object-cover opacity-50"
                />
                <div className="absolute inset-0 grid place-items-center">
                  {item.error ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPending((current) =>
                          current.map((entry) =>
                            entry.key === item.key ? { ...entry, error: null } : entry,
                          ),
                        );
                        void uploadOne(item);
                      }}
                      className="rounded-sm bg-ink px-3 py-1.5 text-[11px] font-semibold text-paper"
                    >
                      Retry
                    </button>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink">
                      Uploading
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-1.5 truncate text-[11px] text-gray">{item.name}</p>
              {item.error && (
                <>
                  <p className="mt-0.5 text-[11px] text-danger">{item.error}</p>
                  <button
                    type="button"
                    onClick={() => removePending(item.key)}
                    className="mt-0.5 text-[11px] text-gray underline"
                  >
                    Remove
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {sareeAssets.length > 0 && (
        <section
          aria-live="polite"
          className="mt-10 rounded-sm border border-line bg-paper-dim p-6"
        >
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray">
            {analysis?.ready ? "Your saree is ready." : "Understanding your saree…"}
          </h2>

          <ul className="mt-4 space-y-2">
            {CHECKLIST.map((entry) => {
              const done = analysis?.detected?.[entry.key] ?? false;
              return (
                <li key={entry.key} className="flex items-center gap-2.5 text-sm">
                  <span
                    aria-hidden="true"
                    className={[
                      "grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px]",
                      done ? "bg-success text-paper" : "border border-gray-light text-transparent",
                    ].join(" ")}
                  >
                    ✓
                  </span>
                  <span className={done ? "text-ink" : "text-gray"}>{entry.label}</span>
                </li>
              );
            })}
          </ul>

          {analysis?.advisories && analysis.advisories.length > 0 && (
            <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
              {analysis.advisories.map((advisory) => (
                <li key={advisory} className="text-xs leading-relaxed text-gray">
                  {advisory}
                </li>
              ))}
            </ul>
          )}

          {analysis?.status === "FAILED" && (
            <p className="mt-4 text-xs text-danger">
              We couldn&apos;t read your saree this time. Your photos are safe — you can still
              continue, or add a clearer photo.
            </p>
          )}
        </section>
      )}

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
        <p className="text-xs text-gray">
          {sareeAssets.length} of {MAX_SAREE_IMAGES} photos added
        </p>
        <button
          type="button"
          disabled={!canContinue}
          onClick={() => router.push(`/studio/${designId}/compose`)}
          className="rounded-sm bg-ink px-6 py-3 text-sm font-semibold text-paper transition enabled:hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue
        </button>
      </div>
      {!canContinue && (
        <p className="mt-2 text-right text-xs text-gray">
          Add at least one photo of your saree to continue.
        </p>
      )}
    </div>
  );
}
