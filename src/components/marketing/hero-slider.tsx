"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface HeroSlide {
  src: string;
  alt: string;
}

const SLIDE_INTERVAL_MS = 6500;

/**
 * Homepage hero image rotator. Slow crossfade with a gentle push-in on the
 * active photo — no external carousel library, respects
 * prefers-reduced-motion by disabling the automatic advance (all slides
 * remain reachable, just not auto-timed).
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="absolute inset-0">
      {slides.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={i === 0}
          sizes="100vw"
          className={`object-cover transition-[opacity,transform] duration-[1800ms,9000ms] ease-out ${
            i === index ? "scale-[1.08] opacity-100" : "scale-100 opacity-0"
          }`}
        />
      ))}
      {slides.length > 1 && (
        <div
          className="absolute bottom-8 right-6 z-20 flex items-center gap-2 md:right-10"
          aria-hidden="true"
        >
          {slides.map((slide, i) => (
            <span
              key={slide.src}
              className={`h-px transition-all duration-700 ${
                i === index ? "w-10 bg-paper" : "w-4 bg-paper/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
