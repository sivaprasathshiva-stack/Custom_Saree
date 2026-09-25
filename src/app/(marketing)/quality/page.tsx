import { SectionLabel } from "@/components/ui/section-label";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Quality & Certification — VELVOREA",
  description: "How VELVOREA checks every custom silk saree against its original specification before dispatch.",
};

const checks = [
  { title: "Artwork resolution", body: "Uploaded motifs are checked against minimum resolution before they're approved for weaving, so detail isn't lost at full scale." },
  { title: "Repeat compatibility", body: "Repeat width and height are checked against the loom limits of your chosen weave — outside that range, the Studio flags it before you can proceed." },
  { title: "Border and zari density", body: "Wide borders and premium zari route through an additional manual check, since they're the most demanding combination for the loom." },
  { title: "Finished-piece inspection", body: "Every completed saree is checked against its original digital specification — colour, motif placement, border and pallu alignment — before it's cleared for dispatch." },
];

export default function QualityPage() {
  return (
    <div className="bg-ivory">
      <section className="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1600px]" data-reveal>
          <BackButton className="mb-8" />
          <SectionLabel>Quality</SectionLabel>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance">
            Verified claims only — nothing published until confirmed.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-pretty text-stone">
            Manufacturability review starts the moment you begin designing in the
            Studio and continues through to the finished piece. Third-party
            certification badges are shown here only once issued, with issuer,
            certificate number and evidence on file — not before.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-x-14 md:grid-cols-2">
          {checks.map((c) => (
            <div key={c.title} className="flex flex-col gap-3 border-t border-line py-8 transition-colors duration-300 hover:border-charcoal" data-reveal>
              <p className="font-serif text-2xl leading-tight md:text-3xl">{c.title}</p>
              <p className="leading-relaxed text-pretty text-stone">{c.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-9">
          <Button href="/studio" variant="primary">
            See manufacturability checks live in the Studio
          </Button>
        </div>
      </section>
    </div>
  );
}
