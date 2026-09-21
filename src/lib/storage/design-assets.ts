/**
 * Object storage for customer assets (requirements §30, §31).
 *
 * Rules this module exists to enforce:
 *  - the bucket is private; the only way to read an asset is a short-lived
 *    signed URL minted after an ownership check (§30.1);
 *  - the storage path is derived, never the customer's filename (§30.2);
 *  - uploads are validated from their bytes before anything is stored (§31).
 */

import { SIGNED_URL_TTL_SECONDS } from "@/config/limits";
import { DomainError } from "@/domain/errors";
import type { AssetType } from "@/domain/types";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";
import { checksum, probeImage } from "@/lib/security/image-validation";

export const DESIGN_ASSETS_BUCKET = "design-assets";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

/**
 * Storage key layout (§30.2).
 *
 * The leading segment is the owner's user id because the storage RLS policy
 * in schema.sql authorizes on `(storage.foldername(name))[1] = auth.uid()`.
 * Anything that changes this layout must change that policy too.
 */
export function buildStorageKey(params: {
  userId: string;
  designId: string;
  assetId: string;
  mimeType: string;
  variant?: string;
}): string {
  const extension = EXTENSION_BY_MIME[params.mimeType] ?? "bin";
  const variant = params.variant ? `derived/${params.variant}` : "original";
  return `${params.userId}/design/${params.designId}/asset/${params.assetId}/${variant}.${extension}`;
}

function assertConfigured(): void {
  if (!isAdminConfigured()) {
    throw new DomainError("NOT_CONFIGURED", {
      message: "Asset storage is not configured in this environment.",
    });
  }
}

export interface StoredAsset {
  assetId: string;
  storageKey: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  checksum: string;
}

/**
 * Validates and stores an uploaded image.
 *
 * Validation happens here rather than in the route so there is exactly one
 * path into the bucket, and no caller can skip it.
 */
export async function storeUploadedImage(params: {
  userId: string;
  designId: string;
  assetId: string;
  bytes: Uint8Array;
  declaredMimeType?: string;
}): Promise<StoredAsset> {
  assertConfigured();

  const probe = probeImage(params.bytes, params.declaredMimeType);
  const digest = await checksum(params.bytes);
  const storageKey = buildStorageKey({
    userId: params.userId,
    designId: params.designId,
    assetId: params.assetId,
    mimeType: probe.mimeType,
  });

  const supabase = createAdminClient();
  const body = params.bytes.slice().buffer as ArrayBuffer;
  const { error } = await supabase.storage
    .from(DESIGN_ASSETS_BUCKET)
    .upload(storageKey, body, {
      contentType: probe.mimeType,
      upsert: false,
      // EXIF is not stripped by Supabase; we never serve the original to a
      // third party and never surface its metadata (§31).
      cacheControl: "private, max-age=31536000",
    });

  if (error) {
    logger.error("Asset upload failed", { designId: params.designId, error });
    throw new DomainError("STORAGE_UNAVAILABLE", { cause: error });
  }

  return {
    assetId: params.assetId,
    storageKey,
    mimeType: probe.mimeType,
    width: probe.width,
    height: probe.height,
    sizeBytes: probe.sizeBytes,
    checksum: digest,
  };
}

/**
 * Stores an image the pipeline generated (a concept, a drape frame).
 *
 * Generated output skips `probeImage` because it is not customer input and is
 * not always a raster format — the mock provider emits SVG. It is still
 * checksummed and still lands in the private bucket.
 */
export async function storeGeneratedImage(params: {
  userId: string;
  designId: string;
  assetId: string;
  bytes: Uint8Array;
  mimeType: string;
  width: number;
  height: number;
  variant?: string;
}): Promise<StoredAsset> {
  assertConfigured();

  if (params.bytes.byteLength === 0) {
    // §63: never trust AI output blindly.
    throw new DomainError("AI_OUTPUT_INVALID", { message: "The generated image was empty." });
  }

  const digest = await checksum(params.bytes);
  const storageKey = buildStorageKey({
    userId: params.userId,
    designId: params.designId,
    assetId: params.assetId,
    mimeType: params.mimeType,
    variant: params.variant,
  });

  const supabase = createAdminClient();
  const body = params.bytes.slice().buffer as ArrayBuffer;
  const { error } = await supabase.storage
    .from(DESIGN_ASSETS_BUCKET)
    .upload(storageKey, body, { contentType: params.mimeType, upsert: true });

  if (error) {
    logger.error("Generated asset upload failed", { designId: params.designId, error });
    throw new DomainError("STORAGE_UNAVAILABLE", { cause: error });
  }

  return {
    assetId: params.assetId,
    storageKey,
    mimeType: params.mimeType,
    width: params.width,
    height: params.height,
    sizeBytes: params.bytes.byteLength,
    checksum: digest,
  };
}

/**
 * Mints a short-lived read URL. The caller is responsible for having already
 * established that this user may see this asset — this function does not, and
 * must not be treated as, an authorization check.
 */
export async function signedUrlFor(
  storageKey: string,
  ttlSeconds: number = SIGNED_URL_TTL_SECONDS,
): Promise<string> {
  assertConfigured();

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(DESIGN_ASSETS_BUCKET)
    .createSignedUrl(storageKey, ttlSeconds);

  if (error || !data?.signedUrl) {
    logger.error("Signed URL creation failed", { error });
    throw new DomainError("STORAGE_UNAVAILABLE", { cause: error });
  }
  return data.signedUrl;
}

/** Batch variant — one round trip for a gallery or a drape's frames. */
export async function signedUrlsFor(
  storageKeys: string[],
  ttlSeconds: number = SIGNED_URL_TTL_SECONDS,
): Promise<Map<string, string>> {
  if (storageKeys.length === 0) return new Map();
  assertConfigured();

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(DESIGN_ASSETS_BUCKET)
    .createSignedUrls(storageKeys, ttlSeconds);

  if (error || !data) {
    logger.error("Batch signed URL creation failed", { error });
    throw new DomainError("STORAGE_UNAVAILABLE", { cause: error });
  }

  const urls = new Map<string, string>();
  for (const entry of data) {
    if (entry.signedUrl && entry.path) urls.set(entry.path, entry.signedUrl);
  }
  return urls;
}

/** Downloads an asset's bytes, for handing a reference image to a provider. */
export async function readAssetBytes(storageKey: string): Promise<Uint8Array> {
  assertConfigured();

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(DESIGN_ASSETS_BUCKET).download(storageKey);
  if (error || !data) {
    throw new DomainError("ASSET_NOT_FOUND", { cause: error });
  }
  return new Uint8Array(await data.arrayBuffer());
}

/**
 * Removes an object from the bucket.
 *
 * Callers soft-delete the `design_assets` row first. A storage failure here is
 * logged but not fatal: an orphaned object is a cleanup problem, whereas a
 * failed request that leaves the row live is a correctness problem (§35 —
 * deleted assets must not remain reachable, which the row-level delete already
 * guarantees since every read goes through a signed URL we refuse to mint).
 */
export async function deleteStoredAsset(storageKey: string): Promise<void> {
  if (!isAdminConfigured()) return;

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(DESIGN_ASSETS_BUCKET).remove([storageKey]);
  if (error) {
    logger.warn("Asset removal failed; row already deleted", { error });
  }
}

export const ASSET_TYPES_REQUIRING_UPLOAD: readonly AssetType[] = ["SAREE_REFERENCE", "IDEA_IMAGE"];
