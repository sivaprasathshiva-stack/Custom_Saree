import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { HeroSlider } from "@/components/marketing/hero-slider";
import { Reveal } from "@/components/marketing/reveal";
import { materials, palette, borders } from "@/components/studio/studio-data";
import { getMedia, MATERIAL_MEDIA_ID } from "@/lib/media-registry";

const process = [
  {
    n: "01",
    label: "Idea",
    description: "Start from a blank canvas, a template, or the bridal preset.",
  },
  {
    n: "02",
    label: "Digital Design",
    description: "Configure material, colour, artwork, repeat, border, pallu and zari.",
    href: "/studio",
  },
  {
    n: "03",
    label: "Technical Review",
    description: "Deterministic rules check manufacturability before anything is approved.",
  },
  {
    n: "04",
    label: "Sample",
    description: "Request a physical swatch or full sample before committing to production.",
    href: "/sample-program",
  },
  {
    n: "05",
    label: "Weaving",
    description: "Your approved design goes to the loom in Elampillai, Salem.",
    href: "/craft",
  },
  {
    n: "06",
    label: "Quality Check",
    description: "Every saree is inspected against a structured checklist before it ships.",
    href: "/quality",
  },
  {
    n: "07",
    label: "Delivery",
    description: "Shipped internationally, with tracking from dispatch to your door.",
    href: "/shipping",
  },
];

export default function Home() {
  const heroSlides = [
    getMedia("home-hero-loom"),
    getMedia("home-hero-loom-2"),
    getMedia("home-hero-loom-3"),
  ].filter((m): m is NonNullable<typeof m> => Boolean(m?.src));
  const statement = getMedia("homepage.material-is-the-product");
  const preview = getMedia("homepage.studio.preview-saree");
  const portrait = getMedia("weaver-portrait-01");
  const closing = getMedia("home-hero-loom-2");

  return (
    <div className="bg-ivory">
      {/* 01 — Cinematic opening */}
      <section className="relative flex min-h-[100dvh] flex-col justify-end overflow-hidden bg-charcoal text-ivory">
        {heroSlides.length > 0 ? (
          <HeroSlider slides={heroSlides.map((m) => ({ src: m.src!, alt: m.alt }))} />
        ) : (
          <MediaPlaceholder
            label="Homepage Hero — Loom in Motion"
            hint="Recommended: 3840×2160 · MP4, muted loop"
            ratio="absolute inset-0 aspect-auto h-full"
            dark
            className="!border-0"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/45 to-charcoal/10" />
        <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 pb-16 md:px-10 md:pb-24">
          <p className="mb-8 text-sm text-stone-light/80">
            Woven to order in Elampillai, Salem
          </p>
          <h1 className="max-w-5xl font-serif text-[clamp(3.5rem,11vw,9.5rem)] font-medium leading-[0.92] tracking-[-0.03em] text-balance">
            Design silk.
            <br />
            <span className="font-normal italic text-gray-light">Weave your idea.</span>
          </h1>
          <div className="mt-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p className="max-w-md text-base leading-relaxed text-pretty text-stone-light/90 md:text-lg">
              A digital studio for creating bespoke silk sarees, from material and colour to
              motif, border and pallu — physically manufactured to your specification.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button href="/studio" variant="dark">Start designing</Button>
              <Button href="/craft" variant="inverted">
                Explore the craft
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 02 — Material names, drifting */}
      <section
        aria-label="Silks we weave"
        className="marquee overflow-hidden border-b border-line py-7"
      >
        <div className="marquee-track flex w-max gap-14 whitespace-nowrap font-serif text-3xl italic text-charcoal/70 md:text-5xl">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-14" aria-hidden={copy === 1}>
              {[...materials.map((m) => m.name), "Bridal", "Zari", "Custom motifs"].map(
                (name) => (
                  <span key={`${copy}-${name}`} className="flex items-center gap-14">
                    {name}
                    <span className="h-1 w-1 rounded-full bg-charcoal/30" />
                  </span>
                ),
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 03 — Textile statement (asymmetric, overlapping) */}
      <section className="mx-auto max-w-[1600px] px-6 pb-32 pt-28 md:px-10 md:pb-44 md:pt-40">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <SectionLabel>The material is the product</SectionLabel>
            <p className="mt-8 font-serif text-4xl leading-[1.08] tracking-[-0.02em] text-balance text-charcoal md:text-6xl lg:text-7xl">
              Every thread can be designed — silk, zari, weave, colour and motif,{" "}
              <span className="italic text-stone">
                engineered together before a single yarn is dyed.
              </span>
            </p>
          </Reveal>
          {statement?.src && (
            <Reveal delay={150} className="md:col-span-4 md:col-start-9 md:mt-40">
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <Image
                  src={statement.src}
                  alt={statement.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* 04 — Material intelligence: scroll gallery */}
      <section className="bg-ivory-deep py-24 md:py-32">
        <div className="mx-auto max-w-[1600px] px-6 md:px-10">
          <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <SectionLabel>Material intelligence</SectionLabel>
              <h2 className="mt-6 max-w-2xl font-serif text-5xl leading-[1] tracking-[-0.02em] text-balance md:text-7xl">
                Four silks, each with its own character.
              </h2>
            </div>
            <Button href="/materials" variant="ghost" className="w-fit">
              All specifications
            </Button>
          </Reveal>
        </div>
        <div className="hide-scrollbar mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 md:gap-8 md:px-10">
          {materials.map((m, i) => {
            const media = getMedia(MATERIAL_MEDIA_ID[m.id]);
            return (
              <article
                key={m.id}
                className={`group w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw] xl:w-[24vw] ${
                  i % 2 === 1 ? "md:mt-16" : ""
                }`}
              >
                <Link
                  href="/materials"
                  className="relative block aspect-[3/4] w-full overflow-hidden bg-ink-soft"
                >
                  {media?.src ? (
                    <Image
                      src={media.src}
                      alt={media.alt}
                      fill
                      sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 30vw, 78vw"
                      className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
                    />
                  ) : (
                    <MediaPlaceholder label={m.name} ratio="aspect-[3/4]" />
                  )}
                </Link>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-3xl leading-none tracking-[-0.01em]">
                      {m.name}
                    </h3>
                    <p className="mt-2 text-sm tabular-nums text-stone">
                      {m.weight} · {m.width} · {m.sheen} sheen
                    </p>
                  </div>
                  <Link
                    href={`/studio?material=${m.id}`}
                    className="shrink-0 pt-1 text-sm text-charcoal underline decoration-line underline-offset-4 transition-colors hover:decoration-charcoal"
                  >
                    Use in Studio
                  </Link>
                </div>
              </article>
            );
          })}
          <div className="w-2 shrink-0 md:w-6" aria-hidden="true" />
        </div>
      </section>

      {/* 05 — From pixel to loom: editorial list */}
      <section className="mx-auto max-w-[1600px] px-6 py-28 md:px-10 md:py-40">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-4">
            <div className="md:sticky md:top-32">
              <SectionLabel>From pixel to loom</SectionLabel>
              <h2 className="mt-6 font-serif text-5xl leading-[1] tracking-[-0.02em] text-balance md:text-6xl">
                Seven steps between an idea and a saree.
              </h2>
            </div>
          </Reveal>
          <ol className="md:col-span-8">
            {process.map((p, i) => {
              const row = (
                <>
                  <span className="font-serif text-4xl italic tabular-nums text-stone transition-colors group-hover:text-charcoal md:text-5xl">
                    {p.n}
                  </span>
                  <span>
                    <span className="block font-serif text-3xl leading-tight md:text-4xl">
                      {p.label}
                    </span>
                    <span className="mt-2 block max-w-md text-pretty text-stone">
                      {p.description}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`hidden text-2xl text-charcoal transition-transform duration-300 group-hover:translate-x-1 md:block ${
                      p.href ? "" : "invisible"
                    }`}
                  >
                    →
                  </span>
                </>
              );
              const rowClass =
                "group grid grid-cols-[4.5rem_1fr] items-baseline gap-6 border-t border-line py-8 md:grid-cols-[6rem_1fr_2rem] md:py-10";
              return (
                <li key={p.n}>
                  <Reveal delay={i * 40}>
                    {p.href ? (
                      <Link
                        href={p.href}
                        className={`${rowClass} transition-colors hover:border-charcoal`}
                      >
                        {row}
                      </Link>
                    ) : (
                      <div className={rowClass}>{row}</div>
                    )}
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* 06 — Textile Studio preview */}
      <section className="overflow-hidden bg-charcoal text-ivory">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-center gap-16 px-6 py-24 md:grid-cols-12 md:px-10 md:py-40">
          <Reveal className="md:col-span-5">
            <SectionLabel dark>The Textile Studio</SectionLabel>
            <h2 className="mt-6 font-serif text-5xl leading-[1] tracking-[-0.02em] text-balance md:text-7xl">
              Design it yourself, down to the last centimetre of{" "}
              <span className="italic text-gray-light">border.</span>
            </h2>
            <p className="mt-8 max-w-md text-pretty text-stone-light/85">
              Choose silk and weave, build a palette, upload artwork, configure repeat,
              border, pallu and zari — with live manufacturability feedback at every step.
            </p>
            <div className="mt-10">
              <Button href="/studio" variant="dark">Enter the Textile Studio</Button>
            </div>
          </Reveal>
          <Reveal delay={150} className="md:col-span-7 md:-mr-10">
            {preview?.src ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={preview.src}
                  alt={preview.alt}
                  fill
                  sizes="(min-width: 768px) 58vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center border border-line-dark bg-charcoal-soft p-10">
                <div className="flex h-full w-[38%] flex-col border border-line-dark">
                  <div
                    className="flex h-1/4 items-center justify-center border-b text-[9px] text-ivory/60"
                    style={{ backgroundColor: palette[0].hex, borderColor: palette[1].hex }}
                  >
                    Pallu
                  </div>
                  <div
                    className="flex flex-1 items-center justify-center text-[9px] text-ivory/40"
                    style={{
                      backgroundColor: palette[0].hex,
                      backgroundImage:
                        "repeating-linear-gradient(45deg, rgba(246,242,234,0.06) 0, rgba(246,242,234,0.06) 2px, transparent 2px, transparent 12px)",
                    }}
                  >
                    {materials[0].name}
                  </div>
                  <div
                    className="flex h-8 items-center justify-center text-[9px] text-charcoal/70"
                    style={{ backgroundColor: palette[1].hex }}
                  >
                    {borders[0].name}
                  </div>
                </div>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* 07 — Craftsmanship */}
      <section className="mx-auto max-w-[1600px] px-6 py-28 md:px-10 md:py-40">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-12">
          <Reveal className="md:col-span-4">
            {portrait?.src ? (
              <div className="relative aspect-[3/4] w-full overflow-hidden">
                <Image
                  src={portrait.src}
                  alt={portrait.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <MediaPlaceholder label="Master Weaver Portrait" ratio="aspect-[3/4]" />
            )}
          </Reveal>
          <Reveal
            delay={150}
            className="flex flex-col justify-end gap-8 md:col-span-7 md:col-start-6"
          >
            <SectionLabel>Craftsmanship</SectionLabel>
            <p className="font-serif text-4xl leading-[1.08] tracking-[-0.02em] text-balance text-charcoal md:text-6xl">
              Behind every design is a weaver, a loom and a discipline{" "}
              <span className="italic text-stone">passed through generations.</span>
            </p>
            <p className="max-w-xl text-pretty text-stone">
              Weaver names, specialisations and factory details are published only once
              verified by the manufacturing team — never fabricated for marketing.
            </p>
            <Button href="/craft" variant="ghost" className="w-fit">
              Meet the weavers
            </Button>
          </Reveal>
        </div>
      </section>

      {/* 08 — Digital passport */}
      <section className="bg-ivory-deep">
        <div className="mx-auto max-w-[1600px] px-6 py-28 md:px-10 md:py-36">
          <div className="grid grid-cols-1 items-center gap-14 md:grid-cols-12">
            <Reveal className="flex flex-col gap-7 md:col-span-6">
              <SectionLabel>The saree passport</SectionLabel>
              <h2 className="font-serif text-5xl leading-[1] tracking-[-0.02em] text-balance text-charcoal md:text-7xl">
                Every finished saree carries its own record.
              </h2>
              <p className="max-w-md text-pretty text-stone">
                Material, weave, zari, production date, quality inspection and
                provenance — scannable by QR code, verifiable without an account.
              </p>
              <Button href="/studio" variant="secondary" className="w-fit">
                Design yours
              </Button>
            </Reveal>
            <Reveal delay={150} className="md:col-span-5 md:col-start-8">
              <div className="bg-ivory p-8 font-mono text-sm tabular-nums shadow-[0_30px_60px_-30px_rgba(10,10,10,0.25)] md:rotate-[1.5deg]">
                <p className="text-stone">Saree passport</p>
                <div className="mt-6 flex items-center justify-between border-b border-line pb-4">
                  <span className="text-stone">Passport ID</span>
                  <span>SS-2026-00124</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-b border-line pb-4">
                  <span className="text-stone">Material</span>
                  <span>Kanchipuram Pure Silk</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-b border-line pb-4">
                  <span className="text-stone">Zari</span>
                  <span>Premium (sample configuration)</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-b border-line pb-4">
                  <span className="text-stone">QC status</span>
                  <span className="text-success">Verified</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-stone">Data</span>
                  <span className="text-stone">Demo passport, not a real order</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 09 — Final CTA */}
      <section className="relative overflow-hidden bg-charcoal text-ivory">
        {closing?.src && (
          <Image
            src={closing.src}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-35"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal via-charcoal/30 to-charcoal" />
        <Reveal className="relative mx-auto max-w-[1600px] px-6 py-40 text-center md:px-10 md:py-56">
          <h2 className="mx-auto max-w-5xl font-serif text-[clamp(3rem,8vw,7.5rem)] leading-[0.95] tracking-[-0.03em] text-balance">
            Make something that{" "}
            <span className="italic text-gray-light">exists only once.</span>
          </h2>
          <div className="mt-12 flex justify-center">
            <Button href="/studio" variant="dark">Create your saree</Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
