import { StudioFrame, type StudioStepId } from "./studio-frame";

/**
 * Route-level loading state.
 *
 * Studio pages read the design, its assets and a batch of signed URLs before
 * they can render, which on a cold serverless start is long enough that an
 * un-skeletoned navigation looks like a dead click. The chrome and the step
 * indicator render immediately so only the content area is pending.
 */
export function StudioSkeleton({
  step,
  lines = 3,
  media = true,
}: {
  step?: StudioStepId;
  lines?: number;
  media?: boolean;
}) {
  return (
    <StudioFrame step={step}>
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-6 sm:py-12" aria-busy="true">
        <span className="sr-only" aria-live="polite">
          Loading your design…
        </span>

        <div className="h-9 w-56 animate-pulse rounded bg-paper-dim motion-reduce:animate-none" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-paper-dim motion-reduce:animate-none" />

        {media && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="aspect-[2/3] w-full animate-pulse rounded-lg bg-paper-dim motion-reduce:animate-none" />
            <div className="space-y-4">
              {Array.from({ length: lines }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-lg bg-paper-dim motion-reduce:animate-none"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </StudioFrame>
  );
}
