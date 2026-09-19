import { SectionLabel } from "@/components/ui/section-label";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { Button } from "@/components/ui/button";
import { materials } from "@/components/studio/studio-data";

export const metadata = { title: "Silk Library — SĀRĪ Studio" };

export default function MaterialsPage() {
  return (
    <div className="bg-ivory">
      <section className="border-b border-line px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1600px]">
          <SectionLabel index="MATERIAL">Silk Library</SectionLabel>
          <h1 className="mt-6 max-w-2xl font-display text-5xl leading-tight md:text-6xl">
            Every silk we weave is a specification, not just a swatch.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-2">
          {materials.map((m) => (
            <div key={m.id} className="grid grid-cols-1 bg-ivory sm:grid-cols-2">
              <MediaPlaceholder label={m.name} ratio="aspect-square" />
              <div className="flex flex-col justify-between p-8">
                <div>
                  <p className="font-display text-2xl">{m.name}</p>
                  <dl className="mt-6 flex flex-col gap-2 font-mono text-[11px] uppercase tracking-[0.1em]">
                    <div className="flex justify-between border-b border-line pb-2">
                      <dt className="text-stone">Weight</dt>
                      <dd>{m.weight}</dd>
                    </div>
                    <div className="flex justify-between border-b border-line pb-2">
                      <dt className="text-stone">Width</dt>
                      <dd>{m.width}</dd>
                    </div>
                    <div className="flex justify-between border-b border-line pb-2">
                      <dt className="text-stone">Drape</dt>
                      <dd>{m.drape}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone">Sheen</dt>
                      <dd>{m.sheen}</dd>
                    </div>
                  </dl>
                </div>
                <div className="mt-8">
                  <Button href="/studio" variant="secondary">Use This Material</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
