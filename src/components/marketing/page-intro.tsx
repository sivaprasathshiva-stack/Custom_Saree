import { ReactNode } from "react";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { BackButton } from "@/components/ui/back-button";

/**
 * Shared intro block for content pages that don't yet have a fully
 * art-directed layout of their own. Keeps every route out of a 404 with a
 * real, on-brand page rather than a blank shell. Pages get a bespoke layout
 * once real content/media exists for them — this is a floor, not the target.
 */
export function PageIntro({
  eyebrow,
  title,
  description,
  cta,
  heroLabel,
  heroHint,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  cta?: { label: string; href: string };
  heroLabel: string;
  heroHint: string;
  children?: ReactNode;
}) {
  return (
    <div className="bg-ivory">
      <section className="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1600px]" data-reveal>
          <BackButton className="mb-8" />
          <SectionLabel>{eyebrow}</SectionLabel>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance">
            {title}
          </h1>
          <p className="mt-8 max-w-xl text-lg text-pretty text-stone">{description}</p>
          {cta && (
            <div className="mt-9">
              <Button href={cta.href} variant="primary">
                {cta.label}
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <MediaPlaceholder label={heroLabel} hint={heroHint} ratio="aspect-[21/9]" />
      </section>

      {children}
    </div>
  );
}
