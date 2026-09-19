import { SectionLabel } from "@/components/ui/section-label";
import { BackButton } from "@/components/ui/back-button";

export const metadata = {
  title: "Contact — VELVOREA",
  description: "Reach VELVOREA directly for orders, consultations and B2B enquiries.",
};

const reasons = [
  { title: "New design or bridal enquiry", body: "Starting a custom saree, or want a consultation before you begin in the Studio." },
  { title: "B2B and bulk orders", body: "Multiple colourways or quantities beyond a single saree — see B2B for the process." },
  { title: "Existing order", body: "A question about a design, sample or order already in progress." },
];

export default function ContactPage() {
  return (
    <div className="bg-ivory">
      <section className="border-b border-line px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1600px]">
          <BackButton className="mb-8" />
          <SectionLabel>Contact</SectionLabel>
          <h1 className="mt-6 max-w-2xl font-display text-5xl leading-tight md:text-6xl">
            Reach the studio directly.
          </h1>
          <p className="mt-6 max-w-xl text-stone">
            Our published email, phone and WhatsApp details are being finalised and
            will appear here directly — we&rsquo;d rather leave this blank a little
            longer than publish a contact channel that isn&rsquo;t actually staffed
            yet.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 pb-20 md:px-10">
        <div className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-3">
          {reasons.map((r) => (
            <div key={r.title} className="flex flex-col gap-3 bg-ivory p-8">
              <p className="font-display text-xl">{r.title}</p>
              <p className="text-sm leading-relaxed text-stone">{r.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
