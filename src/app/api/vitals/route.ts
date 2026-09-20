import { NextResponse } from "next/server";

/**
 * Stub Web Vitals sink (see src/components/web-vitals-reporter.tsx). Logs to
 * the server console only — this is NOT a real analytics backend. No
 * provider (Vercel Analytics/GA/etc.) is wired up; that requires an account
 * decision only the project owner can make. Replace this route (or the
 * fetch call in the reporter) once one is chosen.
 */
export async function POST(request: Request) {
  try {
    const metric = await request.json();
    console.log("[web-vitals:server]", metric.name, metric.value);
  } catch {
    // Malformed beacon payload — not worth failing the request over.
  }
  return NextResponse.json({ ok: true });
}
