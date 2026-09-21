import Link from "next/link";
import { StudioFrame } from "@/components/studio/studio-frame";

/**
 * Submission confirmation (requirements §21).
 *
 * The copy matters here and is prescribed: this is NOT an order. The customer
 * has sent a concept for review, and saying "order successful" would promise
 * something VELVOREA has not yet agreed to make.
 *
 * Display data comes from the query string the submission form appended on
 * redirect — the API response already carried everything, so there is nothing
 * to re-fetch.
 */
export default async function SubmissionConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ designId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { designId } = await params;
  const sp = await searchParams;
  const get = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : "");

  // The full VL-YYYY-NNNNNN identifier. It is what support asks for (§78), so
  // it is never truncated.
  const conceptId = get("conceptId") || "—";
  const submittedAt = get("submittedAt")
    ? new Date(get("submittedAt")).toLocaleString("en-IN")
    : "—";

  return (
    <StudioFrame step="submit" conceptId={conceptId !== "—" ? conceptId : null}>
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <div
          aria-hidden="true"
          className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success text-paper"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 12l6 6L20 6" />
          </svg>
        </div>

        <h1 className="mt-8 font-display text-3xl leading-snug">
          Your concept has reached VELVOREA.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-gray">
          Our textile team will review your concept and contact you about the next step.
        </p>

        <div className="mt-10 inline-block rounded-sm bg-paper-dim px-8 py-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray">
            Concept ID
          </div>
          <div className="mt-1 font-mono text-lg font-semibold tracking-wide">{conceptId}</div>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-5 border-t border-line pt-8 text-left text-xs">
          <div>
            <dt className="text-gray">Submitted</dt>
            <dd className="mt-1">{submittedAt}</dd>
          </div>
          <div>
            <dt className="text-gray">Required by</dt>
            <dd className="mt-1 tabular-nums">{get("requiredByDate") || "—"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-gray">Contact</dt>
            <dd className="mt-1 leading-relaxed">
              {get("name")}
              {get("email") && (
                <>
                  <br />
                  {get("email")}
                </>
              )}
              {get("phone") && (
                <>
                  <br />
                  {get("phone")}
                </>
              )}
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-xs leading-relaxed text-gray">
          Your required-by date helps our design team understand your timeline. Final delivery
          timing is confirmed after design and production review.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/studio/designs"
            className="rounded-sm bg-ink px-6 py-3 text-sm font-semibold text-paper hover:bg-ink-soft"
          >
            View My Designs
          </Link>
          <Link
            href={`/studio/${designId}/woven`}
            className="rounded-sm border border-line px-6 py-3 text-sm font-semibold hover:border-ink"
          >
            View my concept
          </Link>
        </div>
      </div>
    </StudioFrame>
  );
}
