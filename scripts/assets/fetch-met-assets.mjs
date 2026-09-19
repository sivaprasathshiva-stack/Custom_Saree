#!/usr/bin/env node
/**
 * Cultural asset acquisition — Metropolitan Museum of Art Open Access.
 *
 * The Met's Open Access API is public, keyless, and every object it returns
 * is flagged `isPublicDomain`. We only ever download objects where that flag
 * is true. This script is the only place in the project that talks to the
 * Met API — everything downstream (components, pages) reads from the local
 * registry this script writes, never from the live API.
 *
 * Deliberately scoped to the Met only. Smithsonian and Rijksmuseum both
 * require an API key this project doesn't have configured — wiring those up
 * is a follow-up once keys are supplied, not simulated here.
 *
 * Usage: node scripts/assets/fetch-met-assets.mjs
 *
 * IMPORTANT: this script's rights filter (isPublicDomain) is necessary but
 * not sufficient. Met's free-text search surfaces plenty of public-domain
 * results that are off-topic (furniture, arms & armor) or unsuitable for
 * reuse regardless of license (sacred/ceremonial objects — a Buddhist
 * vestment, a devotional triptych, showed up under "silk"/"weaving"
 * queries). EXCLUDE_KEYWORDS below is a first-pass filter for the worst
 * offenders, but it is not a substitute for hand-reviewing this script's
 * console output before curating data/media/cultural-assets.json.
 *
 * CURATION RULE: only ever remove whole entries from the JSON this script
 * writes. Never hand-type or hand-edit title/date/medium/sourceUrl for an
 * entry that survives curation — that metadata must come straight from the
 * API response for the id you're keeping, or attribution silently becomes
 * wrong (this happened once already: a hand-retyped registry ended up with
 * object IDs pointing at different, unrelated works).
 *
 * Downloads the full-resolution `primaryImage`, not `primaryImageSmall` —
 * the latter is ~500-750px, which renders visibly soft in any large or
 * high-DPI placement. Next.js's built-in image optimizer generates the
 * actual served responsive/AVIF/WebP variants from this source at request
 * time, so storing the high-res original here is the correct level for
 * this pipeline, not something to hand-resize ahead of time.
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";

const SEARCH_BASE = "https://collectionapi.metmuseum.org/public/collection/v1/search";
const OBJECT_BASE = "https://collectionapi.metmuseum.org/public/collection/v1/objects";

const MEDIA_DIR = new URL("../../public/media/archive/", import.meta.url);
const REGISTRY_PATH = new URL("../../data/media/cultural-assets.json", import.meta.url);

mkdirSync(MEDIA_DIR, { recursive: true });

// Specific, curated queries — not "saree" (produces generic ecommerce noise).
// Each entry caps how many public-domain, image-bearing results we'll keep.
const QUERIES = [
  { q: "silk textile India", take: 3 },
  { q: "brocade silk", take: 2 },
  { q: "woven silk pattern", take: 2 },
  { q: "zari textile", take: 1 },
  { q: "Indian textile motif", take: 2 },
  { q: "handloom weaving", take: 2 },
  { q: "silk brocade panel", take: 3 },
  { q: "silk damask fabric", take: 3 },
];

// First-pass filter for results that are technically public-domain but
// clearly off-topic or inappropriate to reuse as generic textile-story
// decoration (furniture, arms & armor, devotional/ceremonial objects).
// Case-insensitive substring match against the object title.
const EXCLUDE_KEYWORDS = [
  "crib",
  "triptych",
  "mandylion",
  "vestment",
  "kesa",
  "thangka",
  "deity",
  "bodhisattva",
  "dagger",
  "scabbard",
  "arm guard",
  "dastana",
  "bib",
  "statuette",
  "commode",
  "bookcase",
  "bed",
  "chair",
  "settee",
  "reliquary",
  "shrine",
  "altar",
];

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

async function searchObjectIds(q) {
  const url = `${SEARCH_BASE}?q=${encodeURIComponent(q)}&hasImages=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`search failed for "${q}": ${res.status}`);
  const json = await res.json();
  return json.objectIDs ?? [];
}

async function getObject(id) {
  const res = await fetch(`${OBJECT_BASE}/${id}`);
  if (!res.ok) return null;
  return res.json();
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${url} (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buf);
  return buf.length;
}

async function main() {
  const registry = [];
  const seen = new Set();

  for (const { q, take } of QUERIES) {
    let ids = [];
    try {
      ids = await searchObjectIds(q);
    } catch (e) {
      console.error(`skip query "${q}":`, e.message);
      continue;
    }

    let kept = 0;
    for (const id of ids) {
      if (kept >= take) break;
      if (seen.has(id)) continue;

      const obj = await getObject(id);
      if (!obj) continue;

      // Mandatory rights gate. Anything not explicitly public domain is
      // skipped entirely — never downloaded, never registered.
      if (!obj.isPublicDomain) continue;
      if (!obj.primaryImage) continue;

      const titleLower = (obj.title || "").toLowerCase();
      if (EXCLUDE_KEYWORDS.some((kw) => titleLower.includes(kw))) {
        console.log(`skip (excluded keyword) — "${obj.title}"`);
        continue;
      }

      seen.add(id);
      kept++;

      const slug = slugify(`met-${id}-${obj.title || "object"}`);
      const filename = `${slug || `met-${id}`}.jpg`;
      const localPath = new URL(filename, MEDIA_DIR);

      if (!existsSync(localPath)) {
        try {
          const bytes = await downloadImage(obj.primaryImage, localPath);
          console.log(
            `downloaded ${filename} (${(bytes / 1024).toFixed(0)} KB) — id ${id} — "${obj.title}"`
          );
        } catch (e) {
          console.error(`  failed to download object ${id}:`, e.message);
          continue;
        }
      }

      registry.push({
        id: `met-${id}`,
        title: obj.title || "Untitled",
        institution: "The Metropolitan Museum of Art",
        creator: obj.artistDisplayName || obj.culture || undefined,
        date: obj.objectDate || undefined,
        medium: obj.medium || undefined,
        sourceUrl: obj.objectURL,
        imageUrl: obj.primaryImage,
        localPath: `/media/archive/${filename}`,
        rightsStatus: "PUBLIC_DOMAIN",
        licenseUrl: "https://www.metmuseum.org/policies/open-access",
        attributionRequired: false,
        attributionText: "The Metropolitan Museum of Art, Open Access",
        category: "archive",
        tags: [q],
        intendedUse: "editorial — historical textile reference, not company product",
        query: q,
      });
    }
  }

  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), "utf-8");
  console.log(`\nWrote ${registry.length} assets to data/media/cultural-assets.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
