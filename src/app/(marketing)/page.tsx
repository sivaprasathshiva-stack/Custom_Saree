import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";

const silks = [
  { name: "Kanchipuram Pure Silk", code: "KAN-001", note: "Handloom · Zari compatible" },
  { name: "Banarasi Silk", code: "BAN-002", note: "Jacquard · Brocade" },
  { name: "Tussar Silk", code: "TUS-003", note: "Lightweight · Textured" },
  { name: "Mysore Silk", code: "MYS-004", note: "Plain weave · High sheen" },
];

const process = [
  { n: "01", label: "Idea" },
  { n: "02", label: "Digital Design" },
  { n: "03", label: "Technical Review" },
  { n: "04", label: "Sample" },
  { n: "05", label: "Weaving" },
  { n: "06", label: "Quality Check" },
  { n: "07", label: "Delivery" },
];

export default function Home() {
  return (
    <div className="bg-ivory">
      {/* 01 — Cinematic opening */}
      <section className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden bg-charcoal text-ivory">
        <MediaPlaceholder
          label="Homepage Hero — Loom in Motion"
          hint="Recommended: 3840×2160 · MP4, muted loop"
          ratio="absolute inset-0 aspect-auto h-full"
          dark
          className="!border-0"
        />
        <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 pb-20 md:px-10">
          <p className="text-sm text-gray-light">Custom silk manufacturing</p>
          <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[1.05] md:text-7xl">
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
            <Button href="/craft" variant="secondary" className="border-ivory text-ivory hover:bg-ivory hover:text-charcoal">
              Explore the craft
            </Button>
          </div>
        </div>
      </section>

      {/* 02 — Textile statement */}
      <section className="mx-auto max-w-[1600px] px-6 py-28 md:px-10">
        <SectionLabel>The Material Is the Product</SectionLabel>
        <p className="mt-8 max-w-3xl font-display text-3xl leading-snug text-charcoal md:text-5xl">
          Every thread can be designed — silk, zari, weave, colour and motif, engineered
          together before a single yarn is dyed.
        </p>
      </section>

      {/* 03 — Material intelligence */}
      <section className="border-y border-line bg-ivory-deep">
        <div className="mx-auto max-w-[1600px] px-6 py-24 md:px-10">
          <SectionLabel>Material Intelligence</SectionLabel>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-4">
            {silks.map((s) => (
              <Link
                key={s.code}
                href="/materials"
                className="group flex flex-col border border-line bg-ivory transition-colors hover:border-charcoal"
              >
                <MediaPlaceholder label={s.name} ratio="aspect-[4/5]" />
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <p className="font-display text-xl">{s.name}</p>
                    <p className="mt-1 text-sm text-stone">{s.note}</p>
                  </div>
                  <p className="mt-6 text-sm text-charcoal underline decoration-line underline-offset-4 group-hover:decoration-charcoal">
                    View specification
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 04 — From pixel to loom */}
      <section className="mx-auto max-w-[1600px] px-6 py-28 md:px-10">
        <SectionLabel>From Pixel to Loom</SectionLabel>
        <div className="mt-12 flex flex-col gap-0 md:flex-row md:items-stretch">
          {process.map((p) => (
            <div
              key={p.n}
              className="group relative flex flex-1 flex-col gap-3 border-t border-line py-6 md:border-t-0 md:border-l md:px-6 md:py-0"
            >
              <span className="text-sm text-stone">{p.n}</span>
              <span className="font-display text-lg">{p.label}</span>
            </div>
          ))}
        </div>
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
              border, pallu and zari — with live manufacturability and price feedback at
              every step.
            </p>
            <div className="mt-9">
              <Button href="/studio" variant="dark">Enter the Textile Studio</Button>
            </div>
          </div>
          <MediaPlaceholder
            label="Textile Studio — Live Canvas"
            ratio="aspect-[4/3]"
            hint="Product screenshot / interactive preview"
            dark
          />
        </div>
      </section>

      {/* 06 — Craftsmanship */}
      <section className="mx-auto max-w-[1600px] px-6 py-28 md:px-10">
        <SectionLabel>Craftsmanship</SectionLabel>
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          <MediaPlaceholder
            label="Master Weaver Portrait"
            ratio="aspect-[3/4]"
            className="md:col-span-1"
          />
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
                <span>Premium (demo configuration)</span>
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
