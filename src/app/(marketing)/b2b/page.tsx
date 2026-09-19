import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "B2B & Boutiques — VELVOREA" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="B2B"
      title="Bulk orders, multiple colourways, one point of contact."
      description="Organisation accounts, team invitations, MOQ quoting and purchase-order management for boutiques and buyers. Contact us to set up an organisation account."
      cta={{ label: "Contact sales", href: "/contact" }}
      heroLabel="B2B — Bulk Order Workflow"
      heroHint="Product screenshot once the B2B portal is built"
    />
  );
}
