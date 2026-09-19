import Image from "next/image";
import { archiveAssets } from "@/lib/cultural-assets";

/**
 * "From the Archive" — real public-domain textile references, shown as
 * research/inspiration only. Never implies SĀRĪ Studio owns, made, or is
 * affiliated with these historical objects.
 */
export function ArchiveGrid() {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
      {archiveAssets.map((asset) => (
        <figure key={asset.id} className="flex flex-col">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-ivory-deep">
            <Image
              src={asset.localPath}
              alt={asset.title}
              fill
              sizes="(min-width: 640px) 33vw, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-3 text-sm">
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
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
