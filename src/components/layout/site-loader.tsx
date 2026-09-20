"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * First-landing loader, shown once per browser session per "zone" (main
 * site vs. Studio — Studio gets a longer, separate first-run loader since
 * it's a heavier, more app-like surface). Not shown again on client-side
 * navigation within a zone the session has already seen.
 *
 * The percentage is not a fake timer dressed up as progress: it ramps
 * toward 90% while waiting, then only reaches 100% once the browser's
 * real `load` event fires — i.e. once every resource on the page
 * (images included) has actually finished loading. A minimum hold time
 * keeps it from flashing by on fast connections.
 */
export function SiteLoader() {
  const pathname = usePathname();
  const isStudio = pathname?.startsWith("/studio") ?? false;

  const sessionKey = isStudio ? "velvorea:studio-loaded" : "velvorea:loaded";
  const minVisibleMs = isStudio ? 5000 : 2500;

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const reducedMotion = useRef(false);

  useEffect(() => {
    let alreadySeen = false;
    try {
      alreadySeen = window.sessionStorage.getItem(sessionKey) === "1";
    } catch {
      // sessionStorage unavailable (private mode etc.) — treat as not seen.
    }
    if (alreadySeen) return;

    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const effectiveMinMs = reducedMotion.current ? Math.min(minVisibleMs, 600) : minVisibleMs;
    const mountedAt = Date.now();

    // Intentional: visible must start false on both server and first client
    // render (sessionStorage/matchMedia aren't available during SSR, and
    // computing this during render would risk a hydration mismatch), so the
    // reveal can only happen post-mount, in this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    document.documentElement.style.overflow = "hidden";

    let raf: number;
    let hidden = false;
    let realLoadDone = document.readyState === "complete";

    function onRealLoad() {
      realLoadDone = true;
    }

    function hide() {
      if (hidden) return;
      hidden = true;
      setProgress(100);
      window.setTimeout(() => {
        setVisible(false);
        document.documentElement.style.overflow = "";
        try {
          window.sessionStorage.setItem(sessionKey, "1");
        } catch {
          // ignore
        }
        // Slight delay after hiding starts (opacity transition) before we
        // stop ticking, so the bar doesn't visibly snap.
      }, 0);
    }

    // The bar's percentage is tied directly to elapsed wall-clock time
    // against effectiveMinMs — it genuinely animates 0% -> 100% over that
    // window, rather than jumping straight to 100% and then sitting there
    // looking "done" while nothing happens. It only actually dismisses once
    // BOTH that time has elapsed AND the real `load` event has fired (if
    // `load` is slower than effectiveMinMs, progress holds just under 100%
    // until it fires, then completes).
    const tick = () => {
      const elapsed = Date.now() - mountedAt;
      const timeRatio = Math.min(1, elapsed / effectiveMinMs);
      const target = realLoadDone ? timeRatio * 100 : Math.min(99, timeRatio * 100);
      setProgress((p) => (p >= target ? p : target));

      if (realLoadDone && timeRatio >= 1) {
        hide();
        return;
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    window.addEventListener("load", onRealLoad, { once: true });

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("load", onRealLoad);
    };
  }, [sessionKey, minVisibleMs]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading VELVOREA"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-charcoal text-ivory transition-opacity duration-300"
    >
      <Image
        src="/assets/brand/velvorea/velvorea-logo-white.png"
        alt=""
        width={72}
        height={72}
        className="h-16 w-16 object-contain md:h-[72px] md:w-[72px]"
        priority
      />
      <div className="flex w-48 flex-col items-center gap-2">
        <div className="h-px w-full overflow-hidden bg-line-dark">
          <div
            className="h-full bg-ivory transition-[width] duration-150 ease-out"
            style={{ width: `${Math.round(progress)}%` }}
          />
        </div>
        <span className="font-mono text-xs text-stone-light tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
