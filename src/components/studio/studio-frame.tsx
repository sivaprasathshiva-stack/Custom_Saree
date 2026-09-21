import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared Studio chrome (§4 "Studio navigation", §40).
 *
 * The Studio deliberately does NOT render the marketing site's navigation:
 * once someone is designing, the surrounding site is a distraction and an exit
 * (§7.1). All they get is the wordmark, their designs, and where they are in
 * the flow.
 */

export const STUDIO_STEPS = [
  { id: "upload", label: "Upload" },
  { id: "compose", label: "Compose" },
  { id: "woven", label: "Woven" },
  { id: "drape", label: "Drape" },
  { id: "submit", label: "Submit" },
] as const;

export type StudioStepId = (typeof STUDIO_STEPS)[number]["id"];

function Stepper({ current }: { current: StudioStepId }) {
  const currentIndex = STUDIO_STEPS.findIndex((step) => step.id === current);

  return (
    <nav aria-label="Progress" className="border-b border-line">
      <ol className="mx-auto flex max-w-5xl items-center gap-4 overflow-x-auto px-6 py-4 sm:gap-8">
        {STUDIO_STEPS.map((step, index) => {
          const state = index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming";
          return (
            <li key={step.id} className="flex shrink-0 items-center gap-2">
              <span
                aria-hidden="true"
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  state === "complete" ? "bg-success" : state === "current" ? "bg-ink" : "bg-line",
                ].join(" ")}
              />
              <span
                className={[
                  "font-mono text-[10px] uppercase tracking-[0.18em] sm:text-[11px]",
                  state === "current" ? "text-ink" : "text-gray",
                ].join(" ")}
                aria-current={state === "current" ? "step" : undefined}
              >
                <span className="tabular-nums">{String(index + 1).padStart(2, "0")}</span>{" "}
                {step.label}
                {state === "complete" && <span className="sr-only"> (completed)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function StudioFrame({
  step,
  children,
  conceptId,
}: {
  step?: StudioStepId;
  children: ReactNode;
  conceptId?: string | null;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/studio" className="font-display text-lg tracking-wide">
            VELVOREA
          </Link>
          <div className="flex items-center gap-4">
            {conceptId && (
              <span className="hidden font-mono text-[11px] text-gray sm:inline" title="Concept ID">
                {conceptId}
              </span>
            )}
            <Link href="/studio/designs" className="text-sm font-medium hover:text-accent">
              My Designs
            </Link>
          </div>
        </div>
      </header>

      {step && <Stepper current={step} />}

      <main className="flex-1">{children}</main>
    </div>
  );
}

/** Consistent guardrail copy (§20, §25) — always shown, never paraphrased. */
export function Disclaimer({ children }: { children: ReactNode }) {
  return (
    <p className="mx-auto max-w-prose text-center text-xs leading-relaxed text-gray">{children}</p>
  );
}
