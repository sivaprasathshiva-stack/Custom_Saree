"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Mount once in the marketing layout. Reveals every server-rendered
 * `[data-reveal]` element as it scrolls into view, and re-scans on each
 * client-side navigation. The hidden state is CSS-only (globals.css) and
 * limited to scripting-enabled browsers.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(
      "[data-reveal]:not([data-visible])",
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.visible = "true";
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
