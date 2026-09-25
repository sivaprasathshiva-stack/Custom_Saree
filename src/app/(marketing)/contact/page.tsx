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
      <section className="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1600px]" data-reveal>
          <BackButton className="mb-8" />
          <SectionLabel>Contact</SectionLabel>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance">
            Reach the studio directly.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-pretty text-stone">
            We&rsquo;re a small team in Elampillai, Salem. Messages reach the people who
            actually make the sarees.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-x-14 sm:grid-cols-3">
            {CONTACT_CHANNELS.map((channel) => (
              <a
                key={channel.id}
                href={channel.href}
                {...(channel.id === "email"
                  ? {}
                  : { target: "_blank", rel: "noopener noreferrer" })}
                className="group flex flex-col gap-2 border-t border-line py-8 transition-colors duration-300 hover:border-charcoal"
                data-reveal
              >
                <span className="text-sm text-stone">{channel.label}</span>
                <span className="font-serif text-2xl leading-tight md:text-3xl text-charcoal underline decoration-line underline-offset-4 group-hover:decoration-charcoal">
                  {channel.value}
                </span>
                <span className="leading-relaxed text-pretty text-stone">{channel.note}</span>
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
        <div className="grid grid-cols-1 gap-x-14 md:grid-cols-3">
          {reasons.map((r) => (
            <div key={r.title} className="flex flex-col gap-3 border-t border-line py-8 transition-colors duration-300 hover:border-charcoal" data-reveal>
              <p className="font-serif text-2xl leading-tight md:text-3xl">{r.title}</p>
              <p className="leading-relaxed text-pretty text-stone">{r.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
