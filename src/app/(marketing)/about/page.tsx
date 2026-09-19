import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "About — SĀRĪ Studio" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="About"
      title="A digital studio for a working silk manufacturer."
      description="Company history, legal entity, manufacturing location and team information are configurable business data — shown here once supplied, rather than invented for launch."
      heroLabel="About — Studio/Team"
      heroHint="Team or studio photography"
    />
  );
}
