import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "Orders — VELVOREA" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="Orders"
      title="Track every order from quote to delivery."
      description="Order status, production stage, quality report and shipping tracking in one timeline. No orders exist yet in this prototype."
      heroLabel="Orders — Empty State"
      heroHint="Your first woven piece starts with a design"
    />
  );
}
