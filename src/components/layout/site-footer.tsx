import Link from "next/link";

const columns = [
  {
    title: "Create",
    links: [
      { label: "Textile Studio", href: "/studio" },
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
            <p className="font-display text-2xl text-ivory">
              SĀRĪ <span className="text-gray-light">Studio</span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-light/80">
              A digital studio for designing bespoke silk sarees, physically manufactured
              to your specification.
            </p>
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
          <span>© {new Date().getFullYear()} Sārī Studio. Content shown is placeholder demo data.</span>
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
