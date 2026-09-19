import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "Production Tracker — VELVOREA" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="Production"
      title="Design approved. Silk prepared. Yarn dyed. Weaving next."
      description="Once a production order exists, this page shows the twelve-stage manufacturing timeline with planned/actual dates and progress media for that order."
      heroLabel="Production Timeline"
      heroHint="Real production photography once an order is in progress"
    />
  );
}
