import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "Designer Program — VELVOREA" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="Designer Program"
      title="A workspace for designers working with clients."
      description="Portfolios, private client projects, shareable project links and manufacturing requests — built for designers who need more than a single personal project."
      cta={{ label: "Contact us", href: "/contact" }}
      heroLabel="Designer Portfolio View"
      heroHint="Product screenshot once the designer workspace is built"
    />
  );
}
