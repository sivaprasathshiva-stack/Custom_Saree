import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";

export const metadata = {
  title: "Book a Consultation — VELVOREA",
  description: "Talk through your custom silk saree design before you start in the Textile Studio.",
};

const useCases = [
  {
    title: "Bridal planning",
    body: "Working out material, colour and lead time against a wedding date, before committing to a design.",
  },
  {
    title: "Technical review",
    body: "A specific artwork, repeat or zari density you're not sure is manufacturable as drawn.",
  },
  {
    title: "B2B and bulk orders",
    body: "Multiple colourways, minimum quantities and delivery scheduling — see B2B for the full process.",
  },
];

export default function ConsultationPage() {
  return (
    <div className="bg-ivory">
      <section className="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1600px]" data-reveal>
          <BackButton className="mb-8" />
          <SectionLabel>Consultation</SectionLabel>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance">
            Talk through your design before you start.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-pretty text-stone">
            Not every design decision is best made alone in front of a screen.
            A consultation is a direct conversation about what you want to make,
            before or during your time in the Studio.
          </p>
          <div className="mt-9">
            <Button href="/contact" variant="primary">
              Request a consultation
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-x-14 md:grid-cols-3">
          {useCases.map((u) => (
            <div key={u.title} className="flex flex-col gap-3 border-t border-line py-8 transition-colors duration-300 hover:border-charcoal" data-reveal>
              <p className="font-serif text-2xl leading-tight md:text-3xl">{u.title}</p>
              <p className="leading-relaxed text-pretty text-stone">{u.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-xl text-sm text-stone">
          Self-service scheduling isn&rsquo;t connected yet — a consultation request
          made through Contact is followed up directly rather than booked into an
          automated calendar.
        </p>
      </section>
    </div>
  );
}
