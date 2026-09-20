"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * Phase 1 Web Vitals reporting (14-performance-strategy.md: "Phase 1 should
 * add basic Web Vitals reporting ... so later phases optimize against real
 * numbers, not assumptions").
 *
 * Vercel Analytics + Speed Insights (`@vercel/analytics`, `@vercel/speed-insights`,
 * mounted in `layout.tsx`) is the chosen provider and captures Web Vitals on
 * its own. This hook remains as a secondary, provider-independent measurement
 * path — useful for local debugging (console log in dev) and for the
 * `/api/vitals` stub, which is a lightweight fallback if the Vercel dashboard
 * isn't checked. Not required for the primary Vercel Analytics pipeline.
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[web-vitals]", metric.name, metric.value, metric);
    }
    const body = JSON.stringify(metric);
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/vitals", body);
      } else {
        fetch("/api/vitals", { method: "POST", body, keepalive: true });
      }
    } catch {
      // Best-effort only — a failed vitals beacon must never affect the app.
    }
  });

  return null;
}
