"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

export function SiteNav({ accountLabel }: { accountLabel?: string | null }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const label = accountLabel || "Account";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock page scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={`sticky top-0 z-50 bg-ivory/85 backdrop-blur-md transition-[border-color] duration-300 ${
        scrolled || open ? "border-b border-line" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-[1600px] items-center justify-between px-6 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image
            src="/assets/brand/velvorea/velvorea-logo-black.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 object-contain"
            priority
          />
          <span className="font-serif text-3xl font-medium tracking-[0.04em]">VELVOREA</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`relative text-sm transition-colors duration-200 after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:origin-left after:bg-charcoal after:transition-transform after:duration-300 ${
                isActive(l.href)
                  ? "text-charcoal after:scale-x-100"
                  : "text-charcoal/70 after:scale-x-0 hover:text-charcoal hover:after:scale-x-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <button aria-label="Search" className="text-charcoal/70 transition-colors hover:text-charcoal">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
              <path d="M17 17L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
          <Link
            href="/account"
            className="max-w-[10rem] truncate text-sm text-charcoal/80 transition-colors hover:text-charcoal"
          >
            {label}
          </Link>
          <Button href="/studio" variant="primary">
            Create your saree
          </Button>
        </div>

        <button
          className="relative h-9 w-9 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={`absolute left-1.5 top-[15px] h-px w-6 bg-charcoal transition-transform duration-300 ${
              open ? "translate-y-[3px] rotate-45" : ""
            }`}
          />
          <span
            className={`absolute left-1.5 top-[21px] h-px w-6 bg-charcoal transition-transform duration-300 ${
              open ? "-translate-y-[3px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Full-screen mobile menu — transform/opacity only */}
      <div
        className={`fixed inset-x-0 bottom-0 top-[72px] overflow-y-auto bg-ivory px-6 pb-10 pt-8 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
        }`}
        aria-hidden={!open}
      >
        <nav className="flex flex-col" aria-label="Mobile">
          {links.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              style={{ transitionDelay: open ? `${80 + i * 35}ms` : "0ms" }}
              className={`border-b border-line py-4 font-serif text-4xl tracking-[-0.01em] transition-[opacity,transform] duration-500 ${
                open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              } ${isActive(l.href) ? "italic text-charcoal" : "text-charcoal/85"}`}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-8 flex items-center justify-between gap-4">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              className="truncate text-sm text-charcoal/80"
            >
              {label}
            </Link>
            <Button href="/studio" variant="primary">
              Create your saree
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
