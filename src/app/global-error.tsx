"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Root error boundary — only triggers if something throws above/outside
 * every other error.tsx in the tree (e.g. in the root layout itself). Must
 * render its own <html>/<body> because it replaces the root layout.
 *
 * Per the PRD (§60): never show a stack trace or technical detail to a
 * customer — calm, plain, reassuring language, and always a way back.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ivory px-6 text-center text-charcoal">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-charcoal/60">VELVOREA</p>
        <h1 className="font-serif text-3xl">Something went wrong.</h1>
        <p className="max-w-sm text-sm text-charcoal/70">
          Your design is saved. This is a problem on our side, not something you did — please try
          again in a moment.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => reset()}
            className="bg-charcoal px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-ivory hover:bg-charcoal/80"
          >
            Reload
          </button>
          <Link
            href="/"
            className="border border-charcoal/30 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-charcoal hover:border-charcoal"
          >
            Home
          </Link>
        </div>
      </body>
    </html>
  );
}
