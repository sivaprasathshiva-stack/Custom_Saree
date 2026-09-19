import culturalAssets from "../../data/media/cultural-assets.json";

export type RightsStatus = "CC0" | "PUBLIC_DOMAIN" | "CC_BY" | "REVIEW_REQUIRED";

export interface CulturalAsset {
  id: string;
  title: string;
  institution: string;
  creator?: string;
  date?: string;
  medium?: string;
  sourceUrl: string;
  imageUrl: string;
  localPath: string;
  rightsStatus: RightsStatus;
  licenseUrl?: string;
  attributionRequired: boolean;
  attributionText?: string;
  category: string;
  tags: string[];
  intendedUse: string;
}

/**
 * Curated, hand-reviewed subset of what scripts/assets/fetch-met-assets.mjs
 * downloaded. See that script's header comment for why raw output isn't
 * used directly. Only rightsStatus CC0 | PUBLIC_DOMAIN | CC_BY assets ever
 * reach this file — REVIEW_REQUIRED assets stay out of the registry.
 */
export const archiveAssets = culturalAssets as CulturalAsset[];
