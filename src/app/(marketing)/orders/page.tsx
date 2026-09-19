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
      <section className="border-b border-line px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1600px]">
          <BackButton className="mb-8" />
          <SectionLabel>Orders</SectionLabel>
          <h1 className="mt-6 max-w-2xl font-display text-5xl leading-tight md:text-6xl">
            Track every order from quote to delivery.
          </h1>
          <p className="mt-6 max-w-xl text-stone">
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
        <ol className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
          {stages.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3 bg-ivory p-8">
              <span className="font-mono text-xs text-stone">{String(i + 1).padStart(2, "0")}</span>
              <p className="font-display text-xl">{s.title}</p>
              <p className="text-sm leading-relaxed text-stone">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
