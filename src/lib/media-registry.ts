/**
 * Central media registry. Components must reference media through this file
 * (or a CMS-backed equivalent later) — never inline a hardcoded image/video
 * path or a third-party URL directly in a component.
 *
 * `status: "placeholder"` renders the on-brand MediaPlaceholder component.
 * `status: "sourced"` is licensed stock used for atmosphere/editorial only —
 * it must never be captioned or implied to depict VELVOREA's own factory,
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
  | "3d"
  | "brand";

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
  /** Actual source pixel dimensions — read from the file, never estimated */
  width?: number;
  height?: number;
  aspectRatio?: string;
}

/**
 * Demo registry. No entries here claim to be real factory/product/people
 * photography — everything is `status: "placeholder"` until real assets or
 * a verified licensed source are supplied.
 */
export const mediaRegistry: MediaAsset[] = [
  {
    id: "home-hero-loom",
    type: "image",
    category: "videos",
    status: "owned",
    title: "Homepage Hero — Loom",
    src: "/assets/homepage/hero-loom.png",
    alt: "Silk loom",
    usage: "hero",
    width: 1672,
    height: 941,
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
    status: "owned",
    title: "Master Weaver Portrait",
    src: "/assets/homepage/master-weaver-portrait.png",
    alt: "Portrait of a master weaver",
    usage: "editorial",
    width: 1086,
    height: 1448,
  },
  {
    id: "homepage.material-is-the-product",
    type: "image",
    category: "editorial",
    status: "owned",
    title: "The Material Is the Product",
    src: "/assets/homepage/material-is-the-product.png",
    alt: "Silk thread and material detail",
    usage: "editorial",
    width: 1536,
    height: 1024,
  },
  {
    id: "homepage.studio.preview-saree",
    type: "image",
    category: "sarees",
    status: "owned",
    title: "Textile Studio Preview — Saree",
    src: "/assets/homepage/studio-preview-saree.png",
    alt: "A finished silk saree showing body, border and pallu",
    usage: "editorial",
    width: 1672,
    height: 941,
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
  {
    id: "homepage.material.kanchipuram",
    type: "image",
    category: "materials",
    status: "owned",
    title: "Kanchipuram Silk",
    src: "/assets/homepage/materials/kanchipuram-silk.png",
    alt: "Kanchipuram silk textile",
    usage: "product",
    width: 1122,
    height: 1402,
    aspectRatio: "4:5",
  },
  {
    id: "homepage.material.banarasi",
    type: "image",
    category: "materials",
    status: "owned",
    title: "Banarasi Silk",
    src: "/assets/homepage/materials/banarasi-silk.png",
    alt: "Banarasi silk textile",
    usage: "product",
    width: 1122,
    height: 1402,
    aspectRatio: "4:5",
  },
  {
    id: "homepage.material.tussar",
    type: "image",
    category: "materials",
    status: "owned",
    title: "Tussar Silk",
    src: "/assets/homepage/materials/tussar-silk.png",
    alt: "Tussar silk textile",
    usage: "product",
    width: 1122,
    height: 1402,
    aspectRatio: "4:5",
  },
  {
    id: "homepage.material.mysore",
    type: "image",
    category: "materials",
    status: "owned",
    title: "Mysore Silk",
    src: "/assets/homepage/materials/mysore-silk.png",
    alt: "Mysore silk textile",
    usage: "product",
    width: 1122,
    height: 1402,
    aspectRatio: "4:5",
  },
];

/**
 * NILA — VELVOREA's fictional brand ambassador. All nine reference
 * images are real, supplied assets (status "owned", not placeholder), see
 * docs/brand/nila/ for the full identity system these entries point into.
 */
mediaRegistry.push(
  {
    id: "nila.master.primary",
    type: "image",
    category: "brand",
    status: "owned",
    title: "Nila — Master Primary Reference",
    src: "/assets/brand/nila/master/nila-master-primary.png",
    alt: "Nila, VELVOREA's fictional brand ambassador, in a gold-bordered silk saree",
    usage: "editorial",
  },
  {
    id: "nila.reference.front",
    type: "image",
    category: "brand",
    status: "owned",
    title: "Nila — Front Portrait Reference",
    src: "/assets/brand/nila/master/nila-front-portrait.png",
    alt: "Nila, front-facing portrait reference",
    usage: "editorial",
  },
  {
    id: "nila.reference.3q.left",
    type: "image",
    category: "brand",
    status: "owned",
    title: "Nila — Three-Quarter Left Reference",
    src: "/assets/brand/nila/master/nila-3q-left.png",
    alt: "Nila, three-quarter left facial reference",
    usage: "editorial",
  },
  {
    id: "nila.reference.3q.right",
    type: "image",
    category: "brand",
    status: "owned",
    title: "Nila — Three-Quarter Right Reference",
    src: "/assets/brand/nila/master/nila-3q-right.png",
    alt: "Nila, three-quarter right facial reference",
    usage: "editorial",
  },
  {
    id: "nila.reference.profile",
    type: "image",
    category: "brand",
    status: "owned",
    title: "Nila — Profile Reference",
    src: "/assets/brand/nila/master/nila-profile.png",
    alt: "Nila, profile facial reference",
    usage: "editorial",
  },
  {
    id: "nila.reference.fullbody",
    type: "image",
    category: "brand",
    status: "owned",
    title: "Nila — Full Body Reference",
    src: "/assets/brand/nila/master/nila-full-body.png",
    alt: "Nila, full-body proportion reference in a silk saree",
    usage: "editorial",
  },
  {
    id: "nila.reference.neutral",
    type: "image",
    category: "brand",
    status: "owned",
    title: "Nila — Neutral Expression Reference",
    src: "/assets/brand/nila/master/nila-neutral-expression.png",
    alt: "Nila, neutral expression reference",
    usage: "editorial",
  },
  {
    id: "nila.reference.smile",
    type: "image",
    category: "brand",
    status: "owned",
    title: "Nila — Natural Smile Reference",
    src: "/assets/brand/nila/master/nila-natural-smile.png",
    alt: "Nila, natural smile reference",
    usage: "editorial",
  },
  {
    id: "nila.reference.hair",
    type: "image",
    category: "brand",
    status: "owned",
    title: "Nila — Hair Variation Reference",
    src: "/assets/brand/nila/master/nila-hair-variation.png",
    alt: "Nila, hair-up and hair-down variation reference",
    usage: "editorial",
  }
);

/** Maps studio-data material ids to their media-registry entries — keeps the
 * image mapping in one place rather than duplicating filenames per page. */
export const MATERIAL_MEDIA_ID: Record<string, string> = {
  kan: "homepage.material.kanchipuram",
  ban: "homepage.material.banarasi",
  tus: "homepage.material.tussar",
  mys: "homepage.material.mysore",
};

export function getMedia(id: string): MediaAsset | undefined {
  return mediaRegistry.find((m) => m.id === id);
}

export function getMediaByCategory(category: MediaCategory): MediaAsset[] {
  return mediaRegistry.filter((m) => m.category === category);
}
