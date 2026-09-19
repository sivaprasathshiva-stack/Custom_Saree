/**
 * Central media registry. Components must reference media through this file
 * (or a CMS-backed equivalent later) — never inline a hardcoded image/video
 * path or a third-party URL directly in a component.
 *
 * `status: "placeholder"` renders the on-brand MediaPlaceholder component.
 * `status: "sourced"` is licensed stock used for atmosphere/editorial only —
 * it must never be captioned or implied to depict SĀRĪ Studio's own factory,
 * looms, staff, or product.
 * `status: "owned"` is real company media once supplied.
 */

export type MediaCategory =
  | "factory"
  | "silk"
  | "yarn"
  | "weaving"
  | "jacquard"
  | "zari"
  | "artisans"
  | "sarees"
  | "materials"
  | "editorial"
  | "textures"
  | "videos"
  | "3d";

export type MediaStatus = "placeholder" | "sourced" | "owned";

export interface MediaAsset {
  id: string;
  type: "image" | "video" | "3d";
  category: MediaCategory;
  status: MediaStatus;
  title: string;
  /** Local path once an asset exists at public/media/<category>/<file> */
  src?: string;
  poster?: string;
  alt: string;
  /** Required when status is "sourced" */
  source?: {
    provider: "unsplash" | "pexels" | "pixabay" | "other";
    sourceUrl: string;
    creator?: string;
    license?: string;
  };
  /** Placeholder guidance shown until a real/sourced asset is added */
  placeholderHint?: string;
  usage: "editorial" | "product" | "process" | "hero" | "texture";
}

/**
 * Demo registry. No entries here claim to be real factory/product/people
 * photography — everything is `status: "placeholder"` until real assets or
 * a verified licensed source are supplied.
 */
export const mediaRegistry: MediaAsset[] = [
  {
    id: "home-hero-loom",
    type: "video",
    category: "videos",
    status: "placeholder",
    title: "Homepage Hero — Loom in Motion",
    alt: "Silk loom weaving in motion",
    placeholderHint: "Real factory footage · 4K · 16:9 · 5–15s loop, muted",
    usage: "hero",
  },
  {
    id: "silk-macro-kanchipuram",
    type: "image",
    category: "silk",
    status: "placeholder",
    title: "Kanchipuram Silk — Macro Texture",
    alt: "Close-up of Kanchipuram silk weave texture",
    placeholderHint: "Real material macro photography, 2400×1600, 3:2",
    usage: "product",
  },
  {
    id: "weaver-portrait-01",
    type: "image",
    category: "artisans",
    status: "placeholder",
    title: "Master Weaver Portrait",
    alt: "Portrait of a master weaver",
    placeholderHint:
      "Real portrait with consented, verified subject name/role — never invented",
    usage: "editorial",
  },
  {
    id: "jacquard-weaving-detail",
    type: "video",
    category: "jacquard",
    status: "placeholder",
    title: "Jacquard Weaving — Motif Detail",
    alt: "Jacquard loom producing a silk motif",
    placeholderHint: "Real close-up footage of the actual Jacquard loom in use",
    usage: "process",
  },
];

export function getMedia(id: string): MediaAsset | undefined {
  return mediaRegistry.find((m) => m.id === id);
}

export function getMediaByCategory(category: MediaCategory): MediaAsset[] {
  return mediaRegistry.filter((m) => m.category === category);
}
