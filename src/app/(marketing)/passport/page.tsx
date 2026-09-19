import { SectionLabel } from "@/components/ui/section-label";
import { BackButton } from "@/components/ui/back-button";

export const metadata = {
  title: "Saree Passport — VELVOREA",
  description: "Verify a finished VELVOREA saree's material, weave, zari and production details without an account.",
};

const fields = [
  { title: "Material", body: "The exact silk type and weave the saree was produced with." },
  { title: "Zari", body: "Type and density of the metallic thread used in the border and pallu." },
  { title: "Production date", body: "When weaving was completed at our Elampillai facility." },
  { title: "Quality status", body: "Whether the finished piece passed final inspection against its original specification." },
];

export default function PassportPage() {
  return (
    <div className="bg-ivory">
      <section className="border-b border-line px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1600px]">
          <BackButton className="mb-8" />
          <SectionLabel>Saree Passport</SectionLabel>
          <h1 className="mt-6 max-w-2xl font-display text-5xl leading-tight md:text-6xl">
            Verify a finished saree without an account.
          </h1>
          <p className="mt-6 max-w-xl text-stone">
            Every completed VELVOREA saree is meant to carry a passport — a QR code
            or ID that looks up its real production record. The lookup service
            itself isn&rsquo;t built yet, since no saree has completed production
            through this system to generate one from.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 pb-20 md:px-10">
        <div className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
          {fields.map((f) => (
            <div key={f.title} className="flex flex-col gap-3 bg-ivory p-8">
              <p className="font-display text-xl">{f.title}</p>
              <p className="text-sm leading-relaxed text-stone">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
