import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";

export const metadata = {
  title: "Designer Program — VELVOREA",
  description: "A working relationship for designers building saree projects with their own clients, manufactured in Elampillai, Salem.",
};

const forWho = [
  {
    title: "Independent designers",
    body: "Working with your own clients on bespoke pieces and need a manufacturing partner, not a retail storefront.",
  },
  {
    title: "Boutiques and stylists",
    body: "Putting together looks for clients across multiple designs and need consistent technical review and lead times.",
  },
  {
    title: "Design studios",
    body: "Producing a range under your own name and need production capacity in Elampillai without building it yourselves.",
  },
];

export default function DesignersPage() {
  return (
    <div className="bg-ivory">
      <section className="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1600px]" data-reveal>
          <BackButton className="mb-8" />
          <SectionLabel>Designer Program</SectionLabel>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance">
            A workspace for designers working with clients.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-pretty text-stone">
            The Textile Studio works well for a single design. Designers working
            across multiple client projects need something closer to a shared
            workspace — that&rsquo;s what this program is for.
          </p>
          <div className="mt-9">
            <Button href="/contact" variant="primary">
              Contact us
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-x-14 md:grid-cols-3">
          {forWho.map((f) => (
            <div key={f.title} className="flex flex-col gap-3 border-t border-line py-8 transition-colors duration-300 hover:border-charcoal" data-reveal>
              <p className="font-serif text-2xl leading-tight md:text-3xl">{f.title}</p>
              <p className="leading-relaxed text-pretty text-stone">{f.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-xl text-sm text-stone">
          Portfolios, private client projects and shareable project links aren&rsquo;t
          built yet — every designer relationship currently starts as a direct
          conversation, using the same Studio and manufacturing process as an
          individual order.
        </p>
      </section>
    </div>
  );
}
