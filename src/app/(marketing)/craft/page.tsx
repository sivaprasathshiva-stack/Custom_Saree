import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { BackButton } from "@/components/ui/back-button";

export const metadata = { title: "Our Craft — VELVOREA" };

const stages = [
  {
    title: "Silk sourcing",
    body: "Raw silk yarn is selected and graded before it enters production, matched to the weight and sheen each design calls for.",
  },
  {
    title: "Yarn preparation",
    body: "Yarn is twisted, sized and wound onto bobbins in the sequence the loom needs, ready for warping.",
  },
  {
    title: "Dyeing",
    body: "Colour is matched against your Studio palette and dyed in small batches, so the fabric on the loom matches what you designed on screen.",
  },
  {
    title: "Warping and weaving",
    body: "The warp is set to your chosen repeat, border and pallu configuration, then woven on the loom — zari worked in by hand where the design calls for it.",
  },
  {
    title: "Finishing",
    body: "Loose threads are cleared, the fabric is pressed and the saree is prepared for inspection.",
  },
  {
    title: "Quality control",
    body: "Every piece is checked against its original specification before it's cleared for dispatch — see our approach on the Quality page.",
  },
];

export default function CraftPage() {
  return (
    <div className="bg-ivory">
      <section className="border-b border-line px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1600px]">
          <BackButton className="mb-8" />
          <SectionLabel>Craft</SectionLabel>
          <h1 className="mt-6 max-w-2xl font-display text-5xl leading-tight md:text-6xl">
            Woven in Elampillai, a silk town near Salem.
          </h1>
          <p className="mt-6 max-w-xl text-stone">
            Elampillai, in Salem district, Tamil Nadu, is a long-established centre of
            silk weaving. Every VELVOREA saree is manufactured here — from raw yarn to
            finished, quality-checked fabric — following the specification set in the
            Textile Studio.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <MediaPlaceholder label="Factory — Weaving Floor" hint="Real factory footage, 4K, 16:9" ratio="aspect-[21/9]" />
      </section>

      <section className="mx-auto max-w-[1600px] px-6 pb-20 md:px-10">
        <ol className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {stages.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3 bg-ivory p-8">
              <span className="font-mono text-xs text-stone">{String(i + 1).padStart(2, "0")}</span>
              <p className="font-display text-xl">{s.title}</p>
              <p className="text-sm leading-relaxed text-stone">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 max-w-xl text-sm text-stone">
          Meet the people behind the loom on{" "}
          <Link href="/craft/weavers" className="text-ink underline underline-offset-4">
            Our Weavers
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
