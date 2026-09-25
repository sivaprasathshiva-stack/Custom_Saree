import { BackButton } from "@/components/ui/back-button";

export const metadata = { title: "Shipping — VELVOREA" };

export default function Page() {
  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-32 pt-14 md:px-10 md:pt-20">
      <BackButton className="mb-8" />
      <h1 className="max-w-4xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance" data-reveal>
        Shipping &amp; customs.
      </h1>
      <p className="mt-8 max-w-xl text-lg text-pretty text-stone" data-reveal>Delivery estimates, customs responsibility and tracking, by country, will be published here once shipping integrations are configured.</p>
    </div>
  );
}
