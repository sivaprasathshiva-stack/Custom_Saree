import Image from "next/image";
import Link from "next/link";
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  OFFICE_EMAIL,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from "@/config/contact";

/* Inline SVG rather than an icon package: two glyphs do not justify a
   dependency, and these inherit the surrounding text colour for free. */
function WhatsAppIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.69 8.23-8.25 8.23z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const columns = [
  {
    title: "Create",
    links: [
      { label: "Textile Studio", href: "/studio" },
      { label: "Bridal", href: "/bridal" },
      { label: "Textile Room", href: "/textile-room" },
      { label: "Collections", href: "/collections" },
      { label: "Sample Program", href: "/sample-program" },
    ],
  },
  {
    title: "Material",
    links: [
      { label: "Silk Library", href: "/materials" },
      { label: "Zari", href: "/materials/zari" },
      { label: "Weaves", href: "/materials/weaves" },
      { label: "Quality & Certification", href: "/quality" },
    ],
  },
  {
    title: "Manufacturing",
    links: [
      { label: "Our Factory", href: "/craft" },
      { label: "Our Weavers", href: "/craft/weavers" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Sustainability", href: "/sustainability" },
    ],
  },
  {
    title: "Studio",
    links: [
      { label: "B2B & Boutiques", href: "/b2b" },
      { label: "Designer Program", href: "/designers" },
      { label: "Book a Consultation", href: "/consultation" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line-dark bg-charcoal text-stone-light">
      <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <div className="grid grid-cols-2 gap-10 border-b border-line-dark pb-14 md:grid-cols-6">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <Image
                src="/assets/brand/velvorea/velvorea-logo-white.png"
                alt="VELVOREA"
                width={44}
                height={44}
                className="h-10 w-10 object-contain"
              />
              <p className="font-serif text-3xl font-medium tracking-[0.04em] text-ivory">VELVOREA</p>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-light/80">
              A digital studio for designing bespoke silk sarees, physically manufactured
              to your specification.
            </p>

            <ul className="mt-6 flex flex-col gap-2.5 text-sm">
              <li>
                <a
                  href={`mailto:${OFFICE_EMAIL}`}
                  className="text-stone-light/85 transition-colors hover:text-ivory"
                >
                  {OFFICE_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-stone-light/85 transition-colors hover:text-ivory"
                >
                  <WhatsAppIcon />
                  {WHATSAPP_DISPLAY}
                </a>
              </li>
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-stone-light/85 transition-colors hover:text-ivory"
                >
                  <InstagramIcon />
                  {INSTAGRAM_HANDLE}
                </a>
              </li>
            </ul>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm text-stone">{col.title}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-stone-light/85 transition-colors hover:text-ivory"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 pt-8 text-sm text-stone md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} VELVOREA. Handwoven in Elampillai, Salem, Tamil Nadu.</span>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-ivory">Terms</Link>
            <Link href="/privacy" className="hover:text-ivory">Privacy</Link>
            <Link href="/shipping" className="hover:text-ivory">Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
