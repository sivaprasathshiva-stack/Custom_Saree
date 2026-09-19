import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "About — VELVOREA" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="About"
      title="Made in Elampillai, Salem."
      description="VELVOREA's sarees are manufactured in Elampillai, a silk-weaving town near Salem, Tamil Nadu. Company history, legal entity structure and team information are configurable business data — shown here once supplied, rather than invented for launch."
      heroLabel="About — Studio/Team"
      heroHint="Team or studio photography"
    />
  );
}
