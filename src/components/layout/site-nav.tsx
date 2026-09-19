"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const links = [
  { label: "Create", href: "/studio" },
  { label: "Bridal", href: "/bridal" },
  { label: "Textile Room", href: "/textile-room" },
  { label: "Collections", href: "/collections" },
  { label: "Materials", href: "/materials" },
  { label: "Craft", href: "/craft" },
  { label: "Journal", href: "/journal" },
  { label: "About", href: "/about" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-[1600px] items-center justify-between px-6 py-4 md:px-10">
        <Link href="/" className="font-display text-2xl tracking-wide">
          SĀRĪ <span className="text-gray">Studio</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-charcoal/80 transition-colors hover:text-charcoal"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <button aria-label="Search" className="text-charcoal/70 hover:text-charcoal">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
              <path d="M17 17L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
          <Link
            href="/account"
            className="text-sm text-charcoal/80 hover:text-charcoal"
          >
            Account
          </Link>
          <Button href="/studio" variant="primary">
            Create your saree
          </Button>
        </div>

        <button
          className="flex flex-col gap-1.5 lg:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="h-px w-6 bg-charcoal" />
          <span className="h-px w-6 bg-charcoal" />
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-ivory px-6 py-6 lg:hidden">
          <nav className="flex flex-col gap-5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-base text-charcoal"
              >
                {l.label}
              </Link>
            ))}
            <Button href="/studio" variant="primary" className="mt-2 w-full">
              Create your saree
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
