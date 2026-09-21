import { SectionLabel } from "@/components/ui/section-label";
import { BackButton } from "@/components/ui/back-button";
import { CONTACT_CHANNELS, whatsappUrlWithMessage } from "@/config/contact";

export const metadata = {
  title: "Contact — VELVOREA",
  description: "Reach VELVOREA directly for orders, consultations and B2B enquiries.",
};

const reasons = [
  {
    title: "New design or bridal enquiry",
    body: "Starting a custom saree, or want a consultation before you begin in the Studio.",
  },
  {
    title: "B2B and bulk orders",
    body: "Multiple colourways or quantities beyond a single saree — see B2B for the process.",
  },
  {
    title: "Existing order",
    body: "A question about a design, sample or order already in progress.",
  },
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
            We&rsquo;re a small team in Elampillai, Salem. Messages reach the people who
            actually make the sarees.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-3">
            {CONTACT_CHANNELS.map((channel) => (
              <a
                key={channel.id}
                href={channel.href}
                {...(channel.id === "email"
                  ? {}
                  : { target: "_blank", rel: "noopener noreferrer" })}
                className="group flex flex-col gap-2 bg-ivory p-8 transition-colors hover:bg-ivory-deep"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone">
                  {channel.label}
                </span>
                <span className="font-display text-xl text-charcoal underline decoration-line underline-offset-4 group-hover:decoration-charcoal">
                  {channel.value}
                </span>
                <span className="text-sm leading-relaxed text-stone">{channel.note}</span>
              </a>
            ))}
          </div>

          <a
            href={whatsappUrlWithMessage(
              "Hello VELVOREA — I'd like to ask about a custom saree.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 bg-charcoal px-6 py-3.5 text-sm font-semibold text-ivory transition-colors hover:bg-charcoal-soft"
          >
            Message us on WhatsApp
          </a>
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
