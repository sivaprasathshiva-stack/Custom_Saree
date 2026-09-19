import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { studioPresets } from "@/components/studio/studio-data";

export const metadata = {
  title: "Bridal — SĀRĪ Studio",
  description:
    "A bridal Kanchipuram starting point — temple border, premium zari — designed in the Textile Studio and woven in Elampillai, Salem.",
};

export default function BridalPage() {
  const preset = studioPresets.bridal;

  return (
    <div className="bg-ivory">
      <section className="border-b border-line px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1600px]">
          <SectionLabel>Bridal</SectionLabel>
          <h1 className="mt-6 max-w-2xl font-display text-5xl leading-tight md:text-6xl">
            A saree built for one day, made to be worn for many more.
          </h1>
          <p className="mt-6 max-w-xl text-stone">
            Start from a bridal-appropriate configuration — Kanchipuram silk, temple
            border, premium zari — then make it yours: palette, motif, pallu and
            border are all still fully editable in the Studio. Woven at our facility
            in Elampillai, near Salem, Tamil Nadu.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Button href="/studio?preset=bridal" variant="primary">
              Start with the bridal preset
            </Button>
            <Button href="/consultation" variant="secondary">
              Book a bridal consultation
            </Button>
          </div>
          <p className="mt-4 text-xs text-stone">Starting configuration: {preset.name}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <MediaPlaceholder
          label="Bridal Kanchipuram — Temple Border, Premium Zari"
          variant="hero"
          ratio="aspect-[21/9]"
          hint="Real bridal saree photography, once available"
        />
      </section>

      <section className="border-t border-line bg-ivory-deep">
        <div className="mx-auto max-w-[1600px] px-6 py-24 md:px-10">
          <SectionLabel>What the preset sets</SectionLabel>
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <p className="font-display text-xl">Material</p>
              <p className="mt-2 text-sm text-stone">Kanchipuram Pure Silk — structured drape, high sheen.</p>
            </div>
            <div>
              <p className="font-display text-xl">Border</p>
              <p className="mt-2 text-sm text-stone">Temple Geometry, 6 cm — the widest of the current border set.</p>
            </div>
            <div>
              <p className="font-display text-xl">Pallu</p>
              <p className="mt-2 text-sm text-stone">Temple Geometry Pallu, matching the border motif.</p>
            </div>
            <div>
              <p className="font-display text-xl">Zari</p>
              <p className="mt-2 text-sm text-stone">Premium zari — the highest-density option, reviewed for manufacturability before production.</p>
            </div>
          </div>
          <p className="mt-10 max-w-xl text-sm text-stone">
            This is a starting point, not a fixed product — every field above stays
            editable once you&rsquo;re in the Studio. Pricing shown there is a demo
            estimate; a final quote follows technical review.
          </p>
        </div>
      </section>

      <section className="border-t border-line px-6 py-24 text-center md:px-10">
        <p className="mx-auto max-w-xl font-display text-3xl leading-snug text-charcoal md:text-4xl">
          Design your wedding saree with the same precision as the rest of the day.
        </p>
        <div className="mt-9 flex justify-center">
          <Button href="/studio?preset=bridal" variant="primary">
            Enter the Studio
          </Button>
        </div>
      </section>
    </div>
  );
}
