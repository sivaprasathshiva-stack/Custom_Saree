import { BackButton } from "@/components/ui/back-button";

export const metadata = { title: "Privacy — VELVOREA" };

export default function Page() {
  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-32 pt-14 md:px-10 md:pt-20">
      <BackButton className="mb-8" />
      <h1 className="max-w-4xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance" data-reveal>
        Privacy policy.
      </h1>
      <p className="mt-8 max-w-xl text-lg text-pretty text-stone" data-reveal>How customer data, uploaded artwork and account information are collected, used and retained. Published here once finalised.</p>
    </div>
  );
}
