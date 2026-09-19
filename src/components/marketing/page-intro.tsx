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
      <section className="border-b border-line px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1600px]">
          <BackButton className="mb-8" />
          <SectionLabel>{eyebrow}</SectionLabel>
          <h1 className="mt-6 max-w-2xl font-display text-5xl leading-tight md:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-xl text-stone">{description}</p>
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
