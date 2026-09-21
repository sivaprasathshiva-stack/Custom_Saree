"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { JOB_STAGE_LABELS, type JobStage } from "@/domain/types";
import { ApiError, apiGet, apiPost, pollJob, type JobSnapshot } from "@/lib/api/client";

/**
 * Your Woven Concept (§14.2, §16, §18).
 *
 * Two screens in one component because they are one continuous moment for the
 * customer: the design is being turned into silk, and then it is silk. The
 * processing view shows named stages, never a fabricated percentage (§14.2).
 */

interface ConceptVersion {
  id: string;
  versionNumber: number;
  versionType: string;
  label: string | null;
  createdAt: string;
  imageUrl: string | null;
}

const STAGE_ORDER: JobStage[] = [
  "VALIDATE_INPUT",
  "PREPARE_ASSETS",
  "ANALYSE_LAYOUT",
  "GENERATE_CONCEPT",
  "POST_PROCESS",
  "STORE_ASSET",
  "CREATE_VERSION",
];

/** §21 — the five "Make it better" refinements. */
const REFINEMENTS = [
  "Improve text visibility",
  "Refine motif placement",
  "Create a richer pallu",
  "Simplify the border",
  "Try a more traditional arrangement",
];

export function WovenConceptPanel({
  designId,
  originalUrl,
  initialVersions,
  initialJobId,
  currentVersionId,
  suggestionsEnabled,
  drapeEnabled,
}: {
  designId: string;
  originalUrl: string | null;
  initialVersions: ConceptVersion[];
  initialJobId: string | null;
  currentVersionId: string | null;
  suggestionsEnabled: boolean;
  drapeEnabled: boolean;
}) {
  const router = useRouter();
  const [versions, setVersions] = useState(initialVersions);
  const [selectedId, setSelectedId] = useState<string | null>(
    currentVersionId ?? initialVersions[0]?.id ?? null,
  );
  const [job, setJob] = useState<JobSnapshot | null>(null);
  const [jobId, setJobId] = useState<string | null>(initialJobId);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [sliderPercent, setSliderPercent] = useState(50);
  const [busy, setBusy] = useState(false);

  const selected = versions.find((version) => version.id === selectedId) ?? versions[0] ?? null;

  const loadVersions = useCallback(async () => {
    const result = await apiGet<{ versions: ConceptVersion[]; currentVersionId: string | null }>(
      `/api/studio/designs/${designId}/woven-concepts`,
    );
    setVersions(result.versions);
    setSelectedId(result.currentVersionId ?? result.versions[0]?.id ?? null);
  }, [designId]);

  // Watch the job through to a terminal state, then load what it produced.
  const watchedJob = useRef<string | null>(null);
  useEffect(() => {
    if (!jobId || watchedJob.current === jobId) return;
    watchedJob.current = jobId;

    const controller = new AbortController();
    setError(null);

    void pollJob(jobId, { signal: controller.signal, onUpdate: setJob })
      .then(async (final) => {
        if (controller.signal.aborted) return;
        if (final.status === "SUCCEEDED") {
          await loadVersions();
          setJob(null);
          setJobId(null);
          // Drop ?job= so a refresh doesn't replay a finished job.
          router.replace(`/studio/${designId}/woven`);
        } else {
          setJob(final);
          setError({
            message:
              final.error?.message ??
              "We couldn't create your woven concept this time. Your design is safe.",
            retryable: true,
          });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError({ message: "We lost contact while creating your concept.", retryable: true });
        }
      });

    return () => controller.abort();
  }, [jobId, designId, loadVersions, router]);

  const generate = async (refinement?: string) => {
    setBusy(true);
    setError(null);
    try {
      const result = await apiPost<{ jobId: string }>(
        `/api/studio/designs/${designId}/woven-concepts`,
        refinement ? { refinement } : undefined,
      );
      watchedJob.current = null;
      setJobId(result.jobId);
      setJob(null);
    } catch (caught) {
      setError({
        message: caught instanceof ApiError ? caught.message : "We couldn't start that.",
        retryable: caught instanceof ApiError ? caught.retryable : true,
      });
    } finally {
      setBusy(false);
    }
  };

  // --- processing ---------------------------------------------------------
  if (jobId && !error) {
    const activeIndex = job?.stage ? STAGE_ORDER.indexOf(job.stage as JobStage) : -1;

    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray">
          Weaving your concept
        </p>
        <h1 className="mt-4 font-display text-3xl">Turning your idea into silk</h1>

        <ul aria-live="polite" className="mx-auto mt-12 max-w-sm space-y-3 text-left">
          {STAGE_ORDER.map((stage, index) => {
            const done = activeIndex > index;
            const active = activeIndex === index;
            return (
              <li key={stage} className="flex items-center justify-between gap-4 text-sm">
                <span className={done || active ? "text-ink" : "text-gray-light"}>
                  {JOB_STAGE_LABELS[stage]}
                </span>
                <span aria-hidden="true" className="font-mono text-xs">
                  {done ? <span className="text-success">✓</span> : active ? "…" : ""}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mt-10 text-xs text-gray">
          This usually takes under a minute. You can leave this page — your design is saved.
        </p>
      </div>
    );
  }

  // --- failure ------------------------------------------------------------
  if (error) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-display text-3xl">That didn&apos;t work this time</h1>
        <p className="mt-4 text-sm leading-relaxed text-gray">{error.message}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {error.retryable && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                void generate();
              }}
              disabled={busy}
              className="rounded-sm bg-ink px-6 py-3 text-sm font-semibold text-paper disabled:opacity-40"
            >
              Try Again
            </button>
          )}
          <Link
            href={`/studio/${designId}/compose`}
            className="rounded-sm border border-line px-6 py-3 text-sm font-semibold hover:border-ink"
          >
            Back to Design
          </Link>
        </div>
      </div>
    );
  }

  // --- no concept yet -----------------------------------------------------
  if (!selected) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-display text-3xl">No concept yet</h1>
        <p className="mt-3 text-sm text-gray">
          Head back to your design and create your first woven concept.
        </p>
        <Link
          href={`/studio/${designId}/compose`}
          className="mt-8 inline-block rounded-sm bg-ink px-6 py-3 text-sm font-semibold text-paper"
        >
          Back to Design
        </Link>
      </div>
    );
  }

  // --- result -------------------------------------------------------------
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-3xl">Your Woven Concept</h1>
      <p className="mt-2 max-w-prose text-sm text-gray">
        A visual concept of how your design could appear when woven in silk.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          {/* Original vs woven (§19). A range input rather than a custom drag
              handle, so it is keyboard and screen-reader operable for free. */}
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-sm border border-line bg-paper-dim">
            {selected.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.imageUrl}
                alt="Your woven concept"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            {originalUrl && (
              <div
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${sliderPercent}%` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalUrl}
                  alt="Your original saree"
                  className="absolute inset-y-0 left-0 h-full object-cover"
                  style={{ width: `${(100 / Math.max(sliderPercent, 1)) * 100}%`, maxWidth: "none" }}
                />
              </div>
            )}
            {originalUrl && (
              <>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 w-px bg-paper"
                  style={{ left: `${sliderPercent}%` }}
                />
                <span className="pointer-events-none absolute left-3 top-3 rounded-sm bg-ink/60 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-paper">
                  Original
                </span>
                <span className="pointer-events-none absolute right-3 top-3 rounded-sm bg-ink/60 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-paper">
                  Woven Concept
                </span>
              </>
            )}
          </div>

          {originalUrl && (
            <div className="mt-4">
              <label htmlFor="compare" className="sr-only">
                Compare original and woven concept
              </label>
              <input
                id="compare"
                type="range"
                min={0}
                max={100}
                value={sliderPercent}
                onChange={(event) => setSliderPercent(Number(event.target.value))}
                className="w-full accent-ink"
              />
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-sm border border-line p-4">
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-gray">Material</dt>
                <dd className="text-right font-medium">Based on uploaded saree</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray">Design</dt>
                <dd className="text-right font-medium">Custom concept</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray">Status</dt>
                <dd className="text-right font-medium">Digital concept</dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-gray">
              This is a visualisation, not a production-approved textile. Final appearance will be
              refined by a VELVOREA textile designer.
            </p>
          </section>

          {versions.length > 1 && (
            <section className="rounded-sm border border-line p-4">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray">
                Versions
              </h2>
              <ul className="mt-3 space-y-1.5">
                {versions.map((version) => (
                  <li key={version.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(version.id)}
                      className={[
                        "w-full rounded-sm border px-3 py-2 text-left text-xs transition",
                        version.id === selected.id ? "border-ink" : "border-line hover:border-gray",
                      ].join(" ")}
                    >
                      <span className="font-medium">Version {version.versionNumber}</span>
                      {version.label && (
                        <span className="mt-0.5 block text-[11px] text-gray">{version.label}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {suggestionsEnabled && (
            <section className="rounded-sm border border-line p-4">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray">
                Make it better
              </h2>
              <ul className="mt-3 space-y-1.5">
                {REFINEMENTS.map((refinement) => (
                  <li key={refinement}>
                    <button
                      type="button"
                      onClick={() => void generate(refinement)}
                      disabled={busy}
                      className="w-full rounded-sm px-2 py-2 text-left text-xs transition hover:bg-paper-dim disabled:opacity-40"
                    >
                      {refinement}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-gray-light">
                Each creates a new version — your current concept is kept.
              </p>
            </section>
          )}
        </aside>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <Link
          href={`/studio/${designId}/compose`}
          className="rounded-sm border border-line px-5 py-3 text-sm font-semibold hover:border-ink"
        >
          Back to Design
        </Link>
        <div className="flex flex-wrap gap-3">
          {drapeEnabled && (
            <Link
              href={`/studio/${designId}/drape`}
              className="rounded-sm border border-line px-5 py-3 text-sm font-semibold hover:border-ink"
            >
              See it on NILA →
            </Link>
          )}
          <Link
            href={`/studio/${designId}/submit`}
            className="rounded-sm bg-ink px-6 py-3 text-sm font-semibold text-paper hover:bg-ink-soft"
          >
            Send to VELVOREA
          </Link>
        </div>
      </div>
    </div>
  );
}
