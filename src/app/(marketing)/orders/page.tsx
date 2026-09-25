import { SectionLabel } from "@/components/ui/section-label";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Orders — VELVOREA",
  description: "Track your VELVOREA saree orders from quote to delivery.",
};

const stages = [
  { title: "Design confirmed", body: "Your Studio design passes manufacturability review and is confirmed for production." },
  { title: "In production", body: "Live progress against the six-stage weaving timeline — see Production for what each stage covers." },
  { title: "Quality checked", body: "Checked against the original specification before dispatch." },
  { title: "Shipped", body: "Tracking details from dispatch to delivery, domestic or international." },
];

export default function OrdersPage() {
  return (
    <div className="bg-ivory">
      <section className="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1600px]" data-reveal>
          <BackButton className="mb-8" />
          <SectionLabel>Orders</SectionLabel>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance">
            Track every order from quote to delivery.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-pretty text-stone">
            You have no orders yet. Once a Studio design moves into production, it
            appears here with live status against the stages below.
          </p>
          <div className="mt-9">
            <Button href="/studio" variant="primary">
              Start a design
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 pb-20 md:px-10">
        <ol className="grid grid-cols-1 gap-x-14 md:grid-cols-2 lg:grid-cols-4">
          {stages.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3 border-t border-line py-8 transition-colors duration-300 hover:border-charcoal" data-reveal>
              <span className="font-serif text-2xl italic tabular-nums text-stone">{String(i + 1).padStart(2, "0")}</span>
              <p className="font-serif text-2xl leading-tight md:text-3xl">{s.title}</p>
              <p className="leading-relaxed text-pretty text-stone">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
