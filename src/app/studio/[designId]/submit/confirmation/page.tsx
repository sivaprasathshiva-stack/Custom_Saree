import Link from "next/link";

/**
 * Submission confirmation screen (PRD §34). Reads its display data from the
 * query string the submission form appended on redirect (no extra fetch —
 * the API response already had everything needed) rather than re-querying,
 * since a submission has no further "current state" to show here beyond
 * what was just entered.
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
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");

  const conceptId = get("conceptId").slice(0, 8).toUpperCase() || "—";
  const submittedAt = get("submittedAt") ? new Date(get("submittedAt")).toLocaleString("en-IN") : "—";

  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-16 text-center text-ivory">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass-bright">Submitted</p>
      <h1 className="mt-3 font-serif text-3xl">Thank you — your concept is with us</h1>

      <dl className="mt-8 grid grid-cols-2 gap-4 border border-line-dark p-5 text-left font-mono text-xs">
        <div>
          <dt className="text-stone">Concept ID</dt>
          <dd className="mt-1 text-ivory">{conceptId}</dd>
        </div>
        <div>
          <dt className="text-stone">Submitted</dt>
          <dd className="mt-1 text-ivory">{submittedAt}</dd>
        </div>
        <div>
          <dt className="text-stone">Required by</dt>
          <dd className="mt-1 text-ivory">{get("requiredByDate") || "—"}</dd>
        </div>
        <div>
          <dt className="text-stone">Contact</dt>
          <dd className="mt-1 text-ivory">
            {get("name")}
            <br />
            {get("email")}
            <br />
            {get("phone")}
          </dd>
        </div>
      </dl>

      <p className="mx-auto mt-6 max-w-sm text-sm text-stone-light">
        This date helps our design team understand your timeline. Final delivery timing will be
        confirmed after design and production review.
      </p>

      <div className="mt-8 flex justify-center gap-3">
        <Link
          href={`/studio/${designId}/complete`}
          className="border border-line-dark px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-stone-light hover:border-brass hover:text-brass"
        >
          View My Design
        </Link>
        <Link
          href="/studio/designs"
          className="bg-brass-bright px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-charcoal hover:bg-ivory"
        >
          Back to My Designs
        </Link>
      </div>
    </main>
  );
}
