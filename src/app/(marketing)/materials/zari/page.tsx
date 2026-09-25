import { SectionLabel } from "@/components/ui/section-label";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Zari — VELVOREA",
  description: "Zari types and how they affect a custom silk saree's finish, weight and cost.",
};

const options = [
  {
    name: "Premium zari",
    body: "The highest metallic content and density available in the Studio. Heaviest shine and finish, longest lead time, and routed through an additional dye-house validation step before production because of how demanding it is on the loom.",
  },
  {
    name: "Standard zari",
    body: "A balance of shine, weight and cost that suits most border and pallu work without the extra validation step premium zari requires.",
  },
  {
    name: "Imitation zari",
    body: "A lighter-weight metallic-look thread — the most economical option, and the lightest to wear, at the cost of some shine and longevity compared to real zari.",
  },
];

export default function ZariPage() {
  return (
    <div className="bg-ivory">
      <section className="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1600px]" data-reveal>
          <BackButton className="mb-8" />
          <SectionLabel>Zari</SectionLabel>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance">
            The metallic thread that defines a saree&rsquo;s finish.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-pretty text-stone">
            Zari is the metallic yarn woven into borders, pallus and motif work.
            Its type and density is one of the biggest single factors in both a
            saree&rsquo;s finished appearance and its price.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-x-14 md:grid-cols-3">
          {options.map((o) => (
            <div key={o.name} className="flex flex-col gap-3 border-t border-line py-8 transition-colors duration-300 hover:border-charcoal" data-reveal>
              <p className="font-serif text-2xl leading-tight md:text-3xl">{o.name}</p>
              <p className="leading-relaxed text-pretty text-stone">{o.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-9">
          <Button href="/studio" variant="primary">
            Configure zari in the Studio
          </Button>
        </div>
      </section>
    </div>
  );
}
