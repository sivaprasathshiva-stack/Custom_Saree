import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";

export const metadata = { title: "How It Works — VELVOREA" };

const stages = [
  {
    index: "01",
    title: "Design in the Studio",
    body:
      "Choose your silk, build a colour palette, add or upload artwork, set the repeat, border, pallu and zari. Every choice is priced and checked for manufacturability as you go, so the design you finish with is one we can actually weave.",
    href: "/studio",
  },
  {
    index: "02",
    title: "Manufacturability review",
    body:
      "Our production team checks artwork resolution, repeat compatibility with the loom, border width limits, zari density and colour count against what the specific silk and weave can support, and flags anything that needs adjustment before it goes further.",
    href: "/quality",
  },
  {
    index: "03",
    title: "Sample",
    body:
      "For bridal and high-value orders, a swatch or trial section is woven first so you can confirm colour, texture and motif fidelity against the screen design before full production begins.",
    href: "/sample-program",
  },
  {
    index: "04",
    title: "Production",
    body:
      "Weaving takes place at our facility in Elampillai, near Salem, Tamil Nadu — yarn preparation, dyeing, warping and weaving on the loom, following your finalised specification stage by stage.",
    href: "/production",
  },
  {
    index: "05",
    title: "Quality control",
    body:
      "Finished pieces are checked against the original specification — weave density, colour accuracy, zari placement, border and pallu alignment — before being cleared for dispatch.",
    href: "/quality",
  },
  {
    index: "06",
    title: "Shipping",
    body:
      "Domestic and international shipping, with tracking from the moment your saree leaves Elampillai to the moment it reaches you.",
    href: "/shipping",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-ivory">
      <section className="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1600px]" data-reveal>
          <BackButton className="mb-8" />
          <SectionLabel>How it works</SectionLabel>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance">
            From idea to loom, in six stages.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-pretty text-stone">
            Every custom saree follows the same path, whether it starts from a blank
            canvas in the Studio or one of our bridal presets.
          </p>
          <div className="mt-9">
            <Button href="/studio" variant="primary">
              Start designing
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <ol className="grid grid-cols-1 gap-x-14 md:grid-cols-2 lg:grid-cols-3">
          {stages.map((s) => (
            <li key={s.index} className="flex flex-col gap-4 border-t border-line py-8 transition-colors duration-300 hover:border-charcoal" data-reveal>
              <span className="font-serif text-2xl italic tabular-nums text-stone">{s.index}</span>
              <p className="font-serif text-2xl leading-tight md:text-3xl">{s.title}</p>
              <p className="leading-relaxed text-pretty text-stone">{s.body}</p>
              <Link
                href={s.href}
                className="mt-auto text-sm text-ink underline underline-offset-4"
              >
                Learn more
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
