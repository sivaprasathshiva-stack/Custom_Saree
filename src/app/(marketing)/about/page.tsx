import { SectionLabel } from "@/components/ui/section-label";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "About — VELVOREA",
  description: "VELVOREA is a digital textile studio for bespoke silk sarees, manufactured in Elampillai, Salem, Tamil Nadu.",
};

const principles = [
  {
    title: "Design first, then weave",
    body: "Every saree starts as a design you build in the Textile Studio — material, colour, artwork, border, pallu and zari — not a catalogue item we adjust around the edges.",
  },
  {
    title: "Made where silk is made",
    body: "Production happens in Elampillai, a long-established silk-weaving town in Salem district, Tamil Nadu — not outsourced to whichever mill has capacity that month.",
  },
  {
    title: "Bridal and occasion-first",
    body: "Our priority is the saree that matters most — weddings and milestone occasions — where fit, finish and lead time have to be right the first time.",
  },
  {
    title: "Built for international delivery",
    body: "Customers ordering from outside India are a core part of who we design for, not an afterthought bolted onto a domestic-only process.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-ivory">
      <section className="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1600px]" data-reveal>
          <BackButton className="mb-8" />
          <SectionLabel>About</SectionLabel>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance">
            Made in Elampillai, Salem.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-pretty text-stone">
            VELVOREA is a digital textile studio for bespoke silk sarees. You design
            on screen — material, colour, artwork, border, pallu, zari — and we weave
            it in Elampillai, a silk-weaving town in Salem district, Tamil Nadu.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <MediaPlaceholder label="Studio / Elampillai" hint="Team or facility photography" ratio="aspect-[21/9]" />
      </section>

      <section className="mx-auto max-w-[1600px] px-6 pb-20 md:px-10">
        <ol className="grid grid-cols-1 gap-x-14 md:grid-cols-2 lg:grid-cols-4">
          {principles.map((p) => (
            <li key={p.title} className="flex flex-col gap-3 border-t border-line py-8 transition-colors duration-300 hover:border-charcoal" data-reveal>
              <p className="font-serif text-2xl leading-tight md:text-3xl">{p.title}</p>
              <p className="leading-relaxed text-pretty text-stone">{p.body}</p>
            </li>
          ))}
        </ol>

        <p className="mt-10 max-w-xl text-sm text-stone">
          Company registration details, founding history and team profiles will be
          published here once finalised — we won&rsquo;t publish placeholder names or
          invented history in the meantime.
        </p>

        <div className="mt-9">
          <Button href="/studio" variant="primary">
            Start designing
          </Button>
        </div>
      </section>
    </div>
  );
}
