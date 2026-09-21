"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * First-landing brand loader for the marketing site.
 *
 * Deliberately NOT shown in the Studio. The Studio is a tool people open
 * repeatedly to do work, and it previously sat behind a mandatory five-second
 * splash on every new session — which is most of what "the studio is slow"
 * meant. Studio navigations are covered by real route skeletons
 * (`studio-skeleton.tsx`), which show the actual page furniture instead of
 * hiding it behind a logo.
 *
 * On the marketing site a brief hold is a deliberate brand choice, so it
 * stays — but it is capped hard: the loader can never outlive
 * `MAX_VISIBLE_MS`, because it hides page scrolling while it is up and a
 * `load` event that never fires would otherwise leave the site unusable.
 */

const MIN_VISIBLE_MS = 1200;
const MAX_VISIBLE_MS = 3000;
const SESSION_KEY = "velvorea:loaded";

export function SiteLoader() {
  const pathname = usePathname();
  // Studio and admin are application surfaces, not a brand moment.
  const suppressed =
    (pathname?.startsWith("/studio") ?? false) || (pathname?.startsWith("/admin") ?? false);

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const reducedMotion = useRef(false);

  useEffect(() => {
    if (suppressed) return;

    let alreadySeen = false;
    try {
      alreadySeen = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // sessionStorage unavailable (private mode etc.) — treat as not seen.
    }
    if (alreadySeen) return;

    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minMs = reducedMotion.current ? 300 : MIN_VISIBLE_MS;
    const mountedAt = Date.now();

    // Intentional: `visible` must start false on both server and first client
    // render (sessionStorage/matchMedia aren't available during SSR), so the
    // reveal can only happen post-mount, here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    document.documentElement.style.overflow = "hidden";

    let raf = 0;
    let hidden = false;
    let realLoadDone = document.readyState === "complete";

    const onRealLoad = () => {
      realLoadDone = true;
    };

    const hide = () => {
      if (hidden) return;
      hidden = true;
      setProgress(100);
      setVisible(false);
      document.documentElement.style.overflow = "";
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // ignore
      }
    };

    const tick = () => {
      const elapsed = Date.now() - mountedAt;

      // The hard cap. Whatever the page is still waiting on, the visitor gets
      // their site back.
      if (elapsed >= MAX_VISIBLE_MS) {
        hide();
        return;
      }

      const ratio = Math.min(1, elapsed / minMs);
      const target = realLoadDone ? ratio * 100 : Math.min(95, ratio * 100);
      setProgress((current) => (current >= target ? current : target));

      if (realLoadDone && ratio >= 1) {
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
      // Never leave the document unscrollable because this unmounted early.
      document.documentElement.style.overflow = "";
    };
  }, [suppressed]);

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
