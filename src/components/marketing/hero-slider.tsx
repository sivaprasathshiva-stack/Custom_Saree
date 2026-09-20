"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface HeroSlide {
  src: string;
  alt: string;
}

const SLIDE_INTERVAL_MS = 3000;

/**
 * Homepage hero image rotator. Plain crossfade between real photos — no
 * external carousel library, respects prefers-reduced-motion by disabling
 * the automatic advance (all slides remain reachable, just not auto-timed).
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
          className={`object-cover transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
