import Image from "next/image";
import { SectionLabel } from "@/components/ui/section-label";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { materials } from "@/components/studio/studio-data";
import { getMedia, MATERIAL_MEDIA_ID } from "@/lib/media-registry";

export const metadata = { title: "Silk Library — VELVOREA" };

export default function MaterialsPage() {
  return (
    <div className="bg-ivory">
      <section className="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1600px]" data-reveal>
          <BackButton className="mb-8" />
          <SectionLabel>Silk Library</SectionLabel>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance">
            Every silk we weave is a specification, not just a swatch.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 pb-28 md:px-10">
        <div className="flex flex-col gap-24 md:gap-32">
          {materials.map((m, i) => {
            const media = getMedia(MATERIAL_MEDIA_ID[m.id]);
            const flip = i % 2 === 1;
            return (
              <article
                key={m.id}
                className="grid grid-cols-1 items-end gap-10 md:grid-cols-12 md:gap-16"
                data-reveal
              >
                <div
                  className={`md:col-span-7 ${flip ? "md:order-2 md:col-start-6" : ""}`}
                >
                  {media?.src ? (
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <Image
                        src={media.src}
                        alt={media.alt}
                        fill
                        sizes="(min-width: 768px) 58vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <MediaPlaceholder label={m.name} ratio="aspect-[4/3]" />
                  )}
                </div>
                <div className={`md:col-span-5 ${flip ? "md:order-1 md:col-start-1" : ""}`}>
                  <h2 className="font-serif text-5xl leading-[1] tracking-[-0.02em] md:text-6xl">
                    {m.name}
                  </h2>
                  <dl className="mt-10 flex flex-col text-sm tabular-nums">
                    {[
                      ["Weight", m.weight],
                      ["Width", m.width],
                      ["Drape", m.drape],
                      ["Sheen", m.sheen],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between border-t border-line py-3.5"
                      >
                        <dt className="text-stone">{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-8">
                    <Button href="/studio" variant="secondary">Use this material</Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
