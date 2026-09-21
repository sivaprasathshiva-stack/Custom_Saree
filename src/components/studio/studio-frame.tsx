import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared Studio chrome (§4 "Studio navigation", §40).
 *
 * The Studio deliberately does NOT render the marketing site's navigation:
 * once someone is designing, the surrounding site is a distraction and an
 * exit (§7.1). All they get is the wordmark, their designs, and where they
 * are in the flow.
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
    <nav aria-label="Progress" className="border-b border-line bg-paper">
      {/* Scrolls rather than wraps on a phone, so the five steps stay on one
          line and the current step can be scrolled to. */}
      <ol className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-4 py-3 sm:gap-2 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STUDIO_STEPS.map((step, index) => {
          const state =
            index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming";
          return (
            <li key={step.id} className="flex shrink-0 items-center">
              <span
                className={[
                  "flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors",
                  state === "current" ? "bg-ink text-paper" : "text-gray",
                ].join(" ")}
                aria-current={state === "current" ? "step" : undefined}
              >
                <span
                  aria-hidden="true"
                  className={[
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold",
                    state === "complete"
                      ? "bg-success text-paper"
                      : state === "current"
                        ? "bg-paper text-ink"
                        : "border border-gray-light",
                  ].join(" ")}
                >
                  {state === "complete" ? "✓" : index + 1}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] sm:text-[11px]">
                  {step.label}
                </span>
                {state === "complete" && <span className="sr-only">(completed)</span>}
              </span>

              {index < STUDIO_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={[
                    "mx-0.5 h-px w-3 sm:w-5",
                    index < currentIndex ? "bg-success" : "bg-line",
                  ].join(" ")}
                />
              )}
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
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            href="/studio"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-70"
          >
            <Image
              src="/assets/brand/velvorea/velvorea-logo-black.png"
              alt=""
              width={32}
              height={32}
              className="h-7 w-7 object-contain sm:h-8 sm:w-8"
              priority
            />
            <span className="font-display text-base tracking-[0.06em] sm:text-lg">VELVOREA</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {conceptId && (
              <span
                className="hidden rounded-full bg-paper-dim px-2.5 py-1 font-mono text-[10px] text-gray sm:inline"
                title="Concept ID"
              >
                {conceptId}
              </span>
            )}
            <Link
              href="/studio/designs"
              className="rounded-sm px-2 py-1 text-sm font-medium transition-colors hover:text-accent"
            >
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

/**
 * The Studio's primary action.
 *
 * Rendered as a link when it navigates and a button when it acts, so the
 * browser can prefetch, middle-click and show progress for navigations —
 * which a button handler cannot do.
 */
export function PrimaryAction({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center justify-center rounded-sm bg-ink px-6 py-3.5 text-sm font-semibold text-paper",
        "transition-colors hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        className,
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
