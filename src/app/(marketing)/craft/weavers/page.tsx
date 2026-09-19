import { SectionLabel } from "@/components/ui/section-label";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Our Weavers — VELVOREA",
  description: "The weavers behind every VELVOREA saree, manufactured in Elampillai, Salem, Tamil Nadu.",
};

export default function WeaversPage() {
  return (
    <div className="bg-ivory">
      <section className="border-b border-line px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1600px]">
          <BackButton className="mb-8" />
          <SectionLabel>Weavers</SectionLabel>
          <h1 className="mt-6 max-w-2xl font-display text-5xl leading-tight md:text-6xl">
            Every saree is woven by hand, by name.
          </h1>
          <p className="mt-6 max-w-xl text-stone">
            The weaving in Elampillai is done by real people with real names,
            specialisations and years of experience — not an anonymous factory line.
            We&rsquo;re building this page out with individual weaver profiles, but
            we won&rsquo;t publish a name, photo or story without that person&rsquo;s
            explicit consent, which takes time to do properly.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <MediaPlaceholder label="Master Weaver Portrait" hint="Real portrait, published only with verified consent" ratio="aspect-[21/9]" />
      </section>

      <section className="mx-auto max-w-[1600px] px-6 pb-20 md:px-10">
        <p className="max-w-xl text-sm text-stone">
          Read more about the weaving process itself, independent of any individual
          profile, on the{" "}
          <a href="/craft" className="text-ink underline underline-offset-4">
            Craft
          </a>{" "}
          page.
        </p>
        <div className="mt-9">
          <Button href="/studio" variant="primary">
            Start designing
          </Button>
        </div>
      </section>
    </div>
  );
}
