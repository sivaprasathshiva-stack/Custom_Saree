import { StudioFrame } from "@/components/studio/studio-frame";

/**
 * Shown while the design is being created.
 *
 * Creating a design allocates a concept id and writes a row, which on a cold
 * serverless start is long enough that a customer would otherwise click
 * "Start Designing" and see nothing happen.
 */
export default function NewDesignLoading() {
  return (
    <StudioFrame>
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <div
          aria-hidden="true"
          className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-ink motion-reduce:animate-none"
        />
        <p aria-live="polite" className="mt-6 font-display text-xl">
          Preparing your studio…
        </p>
        <p className="mt-2 text-sm text-gray">This takes just a moment.</p>
      </div>
    </StudioFrame>
  );
}
