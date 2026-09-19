"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "velvorea:loaded";

/**
 * First-landing loader. Shown once per browser session (sessionStorage-
 * gated), not on every client-side route change — Next's App Router
 * doesn't remount the root layout on internal navigation, so this only
 * re-appears on a real fresh load (new tab, hard refresh).
 *
 * The percentage is not a fake timer dressed up as progress: it ramps
 * toward 90% while waiting, then only reaches 100% once the browser's
 * real `load` event fires — i.e. once every resource on the page
 * (images included) has actually finished loading. If the page is
 * already fully loaded by the time this mounts (fast connections),
 * it still holds briefly so the loader isn't a single-frame flash.
 */
export function SiteLoader() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const reducedMotion = useRef(false);

  useEffect(() => {
    let alreadySeen = false;
    try {
      alreadySeen = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // sessionStorage unavailable (private mode etc.) — treat as not seen.
    }
    if (alreadySeen) return;

    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Intentional: visible must start false on both server and first client
    // render (sessionStorage/matchMedia aren't available during SSR, and
    // computing this during render would risk a hydration mismatch), so the
    // reveal can only happen post-mount, in this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    document.documentElement.style.overflow = "hidden";

    let raf: number;
    let done = false;

    function finish() {
      if (done) return;
      done = true;
      setProgress(100);
      const holdMs = reducedMotion.current ? 150 : 400;
      window.setTimeout(() => {
        setVisible(false);
        document.documentElement.style.overflow = "";
        try {
          window.sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          // ignore
        }
      }, holdMs);
    }

    if (reducedMotion.current) {
      // Skip the animated ramp entirely; just wait for real completion.
      setProgress(60);
    } else {
      const tick = () => {
        setProgress((p) => (p >= 90 ? p : p + (90 - p) * 0.06 + 0.4));
        raf = window.requestAnimationFrame(tick);
      };
      raf = window.requestAnimationFrame(tick);
    }

    if (document.readyState === "complete") {
      // Resources already loaded by the time we mounted — still show
      // briefly rather than finishing on the same frame.
      window.setTimeout(finish, 500);
    } else {
      window.addEventListener("load", finish, { once: true });
    }

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("load", finish);
    };
  }, []);

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
