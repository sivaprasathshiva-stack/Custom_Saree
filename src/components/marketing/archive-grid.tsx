import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { archiveAssets } from "@/lib/cultural-assets";

/**
 * "From the Archive" — references real, verified public-domain textile
 * objects (see data/media/cultural-assets.json + scripts/assets), but this
 * phase deliberately renders placeholders instead of the actual images:
 * the product direction for this pass is "functional without media", with
 * real/archive photography reinstated in a later pass. The metadata shown
 * (title, date, institution, source link) is real either way — only the
 * image itself is withheld.
 */
export function ArchiveGrid() {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
      {archiveAssets.map((asset) => (
        <div key={asset.id} className="flex flex-col">
          <MediaPlaceholder
            label={asset.title}
            ratio="aspect-[4/5]"
            variant="craft"
            hint={asset.medium}
          />
          <div className="mt-3 text-sm">
            <p className="text-charcoal">{asset.title}</p>
            <p className="mt-1 text-stone">
              {asset.date ? `${asset.date} · ` : ""}
              {asset.institution}
            </p>
            <a
              href={asset.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-stone underline decoration-line underline-offset-4 hover:text-charcoal hover:decoration-charcoal"
            >
              View at source
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
