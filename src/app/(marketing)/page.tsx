import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { ArchiveGrid } from "@/components/marketing/archive-grid";
import { HeroSlider } from "@/components/marketing/hero-slider";
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
  return (
    <div className="bg-ivory">
      {/* 01 — Cinematic opening */}
      <section className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden bg-charcoal text-ivory">
        {(() => {
          const heroSlides = [
            getMedia("home-hero-loom"),
            getMedia("home-hero-loom-2"),
            getMedia("home-hero-loom-3"),
          ].filter((m): m is NonNullable<typeof m> => Boolean(m?.src));
          return heroSlides.length > 0 ? (
            <HeroSlider
              slides={heroSlides.map((m) => ({ src: m.src!, alt: m.alt }))}
            />
          ) : (
            <MediaPlaceholder
              label="Homepage Hero — Loom in Motion"
              hint="Recommended: 3840×2160 · MP4, muted loop"
              ratio="absolute inset-0 aspect-auto h-full"
              dark
              className="!border-0"
            />
          );
        })()}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 pb-20 md:px-10">
          <h1 className="max-w-4xl font-display text-5xl leading-[1.05] md:text-7xl">
            Design silk.
            <br />
            <span className="text-gray-light">Weave your idea.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base text-stone-light/90 md:text-lg">
            A digital studio for creating bespoke silk sarees, from material and colour to
            motif, border and pallu — physically manufactured to your specification.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Button href="/studio" variant="dark">Start designing</Button>
            <Button href="/craft" variant="inverted">
              Explore the craft
            </Button>
          </div>
        </div>
      </section>

      {/* 02 — Textile statement */}
      <section className="mx-auto max-w-[1600px] px-6 py-28 md:px-10">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div>
            <SectionLabel>The Material Is the Product</SectionLabel>
            <p className="mt-8 max-w-xl font-display text-3xl leading-snug text-charcoal md:text-5xl">
              Every thread can be designed — silk, zari, weave, colour and motif,
              engineered together before a single yarn is dyed.
            </p>
          </div>
          {(() => {
            const media = getMedia("homepage.material-is-the-product");
            return media?.src ? (
              <div className="relative aspect-[3/2] w-full overflow-hidden">
                <Image
                  src={media.src}
                  alt={media.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null;
          })()}
        </div>
      </section>

      {/* 03 — Material intelligence */}
      <section className="border-y border-line bg-ivory-deep">
        <div className="mx-auto max-w-[1600px] px-6 py-24 md:px-10">
          <SectionLabel>Material Intelligence</SectionLabel>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {materials.map((m) => {
              const media = getMedia(MATERIAL_MEDIA_ID[m.id]);
              return (
                <div
                  key={m.id}
                  className="group flex flex-col border border-line bg-ivory transition-colors hover:border-charcoal"
                >
                  <Link href="/materials" className="relative block aspect-[4/5] w-full overflow-hidden">
                    {media?.src ? (
                      <Image
                        src={media.src}
                        alt={media.alt}
                        fill
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                      />
                    ) : (
                      <MediaPlaceholder label={m.name} ratio="aspect-[4/5]" />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                    <div>
                      <Link href="/materials">
                        <p className="font-display text-lg sm:text-xl">{m.name}</p>
                      </Link>
                      <p className="mt-1 text-xs text-stone sm:text-sm">
                        {m.weight} · {m.width} · {m.sheen} sheen
                      </p>
                    </div>
                    <div className="mt-4 flex flex-col gap-1 text-xs sm:mt-6 sm:text-sm">
                      <Link
                        href="/materials"
                        className="text-charcoal underline decoration-line underline-offset-4 group-hover:decoration-charcoal"
                      >
                        View specification
                      </Link>
                      <Link
                        href={`/studio?material=${m.id}`}
                        className="text-stone underline decoration-line underline-offset-4 hover:text-charcoal hover:decoration-charcoal"
                      >
                        Use in Studio
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 04 — From pixel to loom */}
      <section className="mx-auto max-w-[1600px] px-6 py-28 md:px-10">
        <SectionLabel>From Pixel to Loom</SectionLabel>
        <ol className="mt-12 flex flex-col gap-0 md:flex-row md:items-stretch">
          {process.map((p) => {
            const content = (
              <>
                <span className="text-sm text-stone">{p.n}</span>
                <span className="font-display text-lg">{p.label}</span>
                <span className="text-sm text-stone">{p.description}</span>
              </>
            );
            const itemClass =
              "flex flex-1 flex-col gap-2 border-t border-line py-6 md:border-t-0 md:border-l md:px-6 md:py-0";
            return (
              <li key={p.n} className="flex flex-1">
                {p.href ? (
                  <Link href={p.href} className={`group ${itemClass} transition-colors hover:border-charcoal`}>
                    {content}
                    <span className="mt-1 text-sm text-charcoal underline decoration-line underline-offset-4 group-hover:decoration-charcoal">
                      Learn more
                    </span>
                  </Link>
                ) : (
                  <div className={itemClass}>{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* 05 — Textile Studio preview */}
      <section className="border-y border-line-dark bg-charcoal text-ivory">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-center gap-12 px-6 py-24 md:grid-cols-2 md:px-10">
          <div>
            <SectionLabel dark>The Textile Studio</SectionLabel>
            <h2 className="mt-6 font-display text-4xl leading-tight md:text-5xl">
              Design it yourself, down to the last centimetre of border.
            </h2>
            <p className="mt-6 max-w-md text-stone-light/85">
              Choose silk and weave, build a palette, upload artwork, configure repeat,
              border, pallu and zari — with live manufacturability feedback at every step.
            </p>
            <div className="mt-9">
              <Button href="/studio" variant="dark">Enter the Textile Studio</Button>
            </div>
          </div>
          {(() => {
            const preview = getMedia("homepage.studio.preview-saree");
            return preview?.src ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden border border-line-dark">
                <Image
                  src={preview.src}
                  alt={preview.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
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
            );
          })()}
        </div>
      </section>

      {/* 06 — Craftsmanship */}
      <section className="mx-auto max-w-[1600px] px-6 py-28 md:px-10">
        <SectionLabel>Craftsmanship</SectionLabel>
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          {(() => {
            const portrait = getMedia("weaver-portrait-01");
            return portrait?.src ? (
              <div className="relative aspect-[3/4] w-full overflow-hidden md:col-span-1">
                <Image
                  src={portrait.src}
                  alt={portrait.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <MediaPlaceholder
                label="Master Weaver Portrait"
                ratio="aspect-[3/4]"
                className="md:col-span-1"
              />
            );
          })()}
          <div className="flex flex-col justify-center gap-6 md:col-span-2">
            <p className="font-display text-3xl leading-snug text-charcoal md:text-4xl">
              Behind every design is a weaver, a loom and a discipline passed
              through generations.
            </p>
            <p className="max-w-xl text-stone">
              Weaver names, specialisations and factory details are published only once
              verified by the manufacturing team — never fabricated for marketing.
            </p>
            <Button href="/craft" variant="ghost" className="w-fit">
              Meet the weavers
            </Button>
          </div>
        </div>
      </section>

      {/* From the archive */}
      <section className="border-t border-line bg-ivory-deep">
        <div className="mx-auto max-w-[1600px] px-6 py-28 md:px-10">
          <SectionLabel>From the archive</SectionLabel>
          <p className="mt-6 max-w-2xl font-display text-3xl leading-snug text-charcoal md:text-4xl">
            Motifs and weave structures travel across centuries. VELVOREA&rsquo;s
            material library draws on that history without claiming it.
          </p>
          <div className="mt-12">
            <ArchiveGrid />
          </div>
          <p className="mt-8 max-w-xl text-sm text-stone">
            Public-domain works shown for research and inspiration only, via The
            Metropolitan Museum of Art&rsquo;s Open Access program. VELVOREA has no
            affiliation with and does not claim to have made these objects.
          </p>
        </div>
      </section>

      {/* 07 — Digital passport */}
      <section className="border-t border-line bg-ivory-deep">
        <div className="mx-auto max-w-[1600px] px-6 py-28 md:px-10">
          <SectionLabel>The Saree Passport</SectionLabel>
          <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="flex flex-col justify-center gap-6">
              <h2 className="font-display text-4xl leading-tight text-charcoal md:text-5xl">
                Every finished saree carries its own record.
              </h2>
              <p className="max-w-md text-stone">
                Material, weave, zari, production date, quality inspection and
                provenance — scannable by QR code, verifiable without an account.
              </p>
              <Button href="/studio" variant="secondary" className="w-fit">
                Design Yours
              </Button>
            </div>
            <div className="border border-line bg-ivory p-8 font-mono text-sm">
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
          </div>
        </div>
      </section>

      {/* 08 — Final CTA */}
      <section className="bg-charcoal text-ivory">
        <div className="mx-auto max-w-[1600px] px-6 py-32 text-center md:px-10">
          <h2 className="font-display text-4xl leading-tight md:text-6xl">
            Make something that exists only once.
          </h2>
          <div className="mt-10 flex justify-center">
            <Button href="/studio" variant="dark">Create your saree</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
