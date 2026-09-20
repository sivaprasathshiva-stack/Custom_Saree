"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Route-segment error boundary for everything under /studio (editor,
 * /studio/new, /studio/designs, /studio/[designId]/complete|submit). Matches
 * the Studio surface's own charcoal/ivory/brass palette rather than the
 * lighter marketing-site theme, so a failure still looks "on brand" instead
 * of like a generic crash page.
 *
 * Per the PRD (§60): plain, reassuring language — no stack traces, no
 * technical jargon — plus a real way forward: retry the segment, go back,
 * or bail out to the homepage. Autosave already runs on a 1.5s debounce
 * (see studio-shell.tsx), so "your design is saved" here is honest, not a
 * placeholder reassurance.
 */
export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-charcoal px-6 text-center text-ivory">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone">VELVOREA Studio</p>
      <h1 className="font-serif text-3xl">Something went wrong.</h1>
      <p className="max-w-sm text-sm text-stone-light">
        Your design is saved. This is a problem on our side, not something you did — please try
        again in a moment.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => reset()}
          className="bg-brass-bright px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-charcoal hover:bg-ivory"
        >
          Reload
        </button>
        <button
          onClick={() => router.back()}
          className="border border-line-dark px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-stone-light hover:border-brass hover:text-brass"
        >
          Go Back
        </button>
        <Link
          href="/"
          className="border border-line-dark px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-stone-light hover:border-brass hover:text-brass"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
