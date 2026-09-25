import { SectionLabel } from "@/components/ui/section-label";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Textile Room — VELVOREA",
  description: "Signature saree configurations you can customise from a real starting point instead of a blank canvas.",
};

const presets = [
  {
    name: "Bridal Kanchipuram",
    body: "Kanchipuram pure silk, temple border, premium zari — a starting point for bridal and occasion sarees, fully editable once you're in the Studio.",
    href: "/studio?preset=bridal",
  },
];

export default function TextileRoomPage() {
  return (
    <div className="bg-ivory">
      <section className="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1600px]" data-reveal>
          <BackButton className="mb-8" />
          <SectionLabel>Textile Room</SectionLabel>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance">
            Configured starting points, ready to make your own.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-pretty text-stone">
            Every configuration here — material, palette, border, pallu and zari
            already resolved — opens directly in the Studio with those choices
            pre-filled, and every field stays editable from there. One configuration
            is live today; more will be added as they&rsquo;re built and validated, not
            invented for a fuller-looking grid.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-x-14 md:grid-cols-2 lg:grid-cols-3">
          {presets.map((p) => (
            <div key={p.name} className="flex flex-col gap-3 border-t border-line py-8 transition-colors duration-300 hover:border-charcoal" data-reveal>
              <p className="font-serif text-2xl leading-tight md:text-3xl">{p.name}</p>
              <p className="leading-relaxed text-pretty text-stone">{p.body}</p>
              <a href={p.href} className="mt-auto text-sm text-ink underline underline-offset-4">
                Open in Studio
              </a>
            </div>
          ))}
        </div>
        <div className="mt-9">
          <Button href="/studio" variant="primary">
            Or start from a blank design
          </Button>
        </div>
      </section>
    </div>
  );
}
