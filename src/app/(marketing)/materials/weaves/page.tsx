import { SectionLabel } from "@/components/ui/section-label";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Weaves — VELVOREA",
  description: "Plain, jacquard and brocade weaves, and what each means for a custom silk saree design.",
};

const weaves = [
  {
    name: "Plain weave",
    body: "The simplest structure — warp and weft cross one over one. Lightweight, flexible, and the base for most solid-colour or lightly patterned body fabric.",
  },
  {
    name: "Jacquard weave",
    body: "Individually controlled warp threads let complex motifs and repeats be woven directly into the fabric rather than printed or embroidered on. This is how most of the Studio's border and pallu artwork gets realised as actual woven structure.",
  },
  {
    name: "Brocade",
    body: "Supplementary weft threads (often zari) create a raised, textured pattern on top of the base weave. Denser and heavier than plain jacquard, typically reserved for borders and pallus rather than the full body.",
  },
  {
    name: "Tissue weave",
    body: "A fine metallic weft woven through the entire body, giving the fabric an overall shimmer rather than pattern confined to specific motifs. Common in lighter, more fluid silks like Tussar.",
  },
];

export default function WeavesPage() {
  return (
    <div className="bg-ivory">
      <section className="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1600px]" data-reveal>
          <BackButton className="mb-8" />
          <SectionLabel>Weaves</SectionLabel>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance">
            Plain, jacquard and brocade — each with its own constraints.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-pretty text-stone">
            The weave determines what a design can actually do — how fine a motif can
            be, how heavy the finished fabric feels, and how the border sits against
            the body. Every material in the Silk Library is paired with weaves it
            actually supports.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-x-14 md:grid-cols-2">
          {weaves.map((w) => (
            <div key={w.name} className="flex flex-col gap-3 border-t border-line py-8 transition-colors duration-300 hover:border-charcoal" data-reveal>
              <p className="font-serif text-2xl leading-tight md:text-3xl">{w.name}</p>
              <p className="leading-relaxed text-pretty text-stone">{w.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-xl text-sm text-stone">
          Exact density limits and repeat constraints per weave are validated by the
          Studio&rsquo;s manufacturability check as you design — see{" "}
          <a href="/quality" className="text-ink underline underline-offset-4">
            Quality &amp; Certification
          </a>{" "}
          for how that review works.
        </p>
        <div className="mt-9">
          <Button href="/studio" variant="primary">
            Choose a weave in the Studio
          </Button>
        </div>
      </section>
    </div>
  );
}
