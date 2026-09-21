import {
  MAX_IDEA_IMAGES,
  MAX_SAREE_IMAGES,
  MAX_UPLOAD_SIZE_BYTES,
} from "@/config/limits";
import { DomainError } from "@/domain/errors";
import type { AssetType } from "@/domain/types";
import { requireEditableDesign, withAuthedRoute } from "@/lib/api/handler";
import { created, ok } from "@/lib/api/response";
import { recordAudit } from "@/lib/audit/audit-log";
import { enqueueJob } from "@/lib/jobs/queue";
import { kickWorker } from "@/lib/jobs/worker";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { deleteStoredAsset, signedUrlsFor, storeUploadedImage } from "@/lib/storage/design-assets";
import { assertContentAllowed } from "@/lib/studio/moderation";
import { countAssets, insertAsset, listAssets } from "@/lib/studio/repository";

/**
 * Asset upload (§8, §31, §34.5).
 *
 * The file is read into memory and validated from its bytes before anything
 * touches storage. Everything the client claims — MIME type, dimensions, which
 * design it belongs to — is re-derived or re-checked server-side (§85 Rule 6).
 */

type Params = { designId: string };

const UPLOADABLE_TYPES: readonly AssetType[] = ["SAREE_REFERENCE", "IDEA_IMAGE"];

function limitFor(type: AssetType): number {
  return type === "SAREE_REFERENCE" ? MAX_SAREE_IMAGES : MAX_IDEA_IMAGES;
}

function limitErrorFor(type: AssetType): DomainError {
  return new DomainError(
    type === "SAREE_REFERENCE" ? "TOO_MANY_SAREE_IMAGES" : "TOO_MANY_IDEA_IMAGES",
    { details: { maximum: limitFor(type) } },
  );
}

export const GET = withAuthedRoute<Params>(
  "GET /api/studio/designs/[designId]/assets",
  async (context) => {
    const design = await requireEditableDesign(context, context.params.designId);
    const assets = await listAssets(design.id);

    // Signed URLs are minted only after ownership has been established above.
    const urls = await signedUrlsFor(assets.map((asset) => asset.storage_key));

    return ok(
      {
        assets: assets.map((asset) => ({
          id: asset.id,
          type: asset.type,
          mimeType: asset.mime_type,
          width: asset.width,
          height: asset.height,
          originalFilename: asset.original_filename,
          url: urls.get(asset.storage_key) ?? null,
        })),
      },
      context.requestId,
    );
  },
);

export const POST = withAuthedRoute<Params>(
  "POST /api/studio/designs/[designId]/assets",
  async (context) => {
    await enforceRateLimit("upload", context.userId);

    const design = await requireEditableDesign(context, context.params.designId);

    let form: FormData;
    try {
      form = await context.request.formData();
    } catch {
      throw new DomainError("VALIDATION_FAILED", { message: "The upload could not be read." });
    }

    const file = form.get("file");
    const rawType = String(form.get("type") ?? "SAREE_REFERENCE") as AssetType;

    if (!(file instanceof File)) {
      throw new DomainError("VALIDATION_FAILED", { message: "No file was included." });
    }
    if (!UPLOADABLE_TYPES.includes(rawType)) {
      throw new DomainError("VALIDATION_FAILED", { message: "Unknown upload type." });
    }

    // Check the declared size before buffering, so an oversized upload is
    // rejected without reading it all into memory first.
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new DomainError("FILE_TOO_LARGE", {
        details: { maxBytes: MAX_UPLOAD_SIZE_BYTES, actualBytes: file.size },
      });
    }

    const existing = await countAssets(design.id, rawType);
    if (existing >= limitFor(rawType)) throw limitErrorFor(rawType);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const assetId = crypto.randomUUID();

    // storeUploadedImage runs the magic-byte and dimension checks; anything
    // that is not a real, supported image throws before it reaches storage.
    const stored = await storeUploadedImage({
      userId: context.userId,
      designId: design.id,
      assetId,
      bytes,
      declaredMimeType: file.type || undefined,
    });

    // Screen the customer's own artwork before it can be composed onto a
    // saree or reach the design team (§36). The saree reference photograph is
    // not screened — it is a picture of the customer's own garment, and
    // rejecting those would be both useless and insulting.
    if (rawType === "IDEA_IMAGE") {
      const [previewUrl] = [...(await signedUrlsFor([stored.storageKey])).values()];
      try {
        await assertContentAllowed(
          {
            image: {
              assetId,
              url: previewUrl,
              mimeType: stored.mimeType,
              width: stored.width,
              height: stored.height,
            },
          },
          { designId: design.id, userId: context.userId, subject: "IDEA_IMAGE", entityId: assetId },
        );
      } catch (error) {
        // Rejected content must not linger in the bucket.
        await deleteStoredAsset(stored.storageKey);
        throw error;
      }
    }

    const asset = await insertAsset({
      id: assetId,
      designId: design.id,
      userId: context.userId,
      type: rawType,
      storageKey: stored.storageKey,
      originalFilename: file.name || null,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      width: stored.width,
      height: stored.height,
      checksum: stored.checksum,
    });

    await recordAudit({
      action: "ASSET_UPLOADED",
      entityType: "asset",
      entityId: asset.id,
      actorUserId: context.userId,
      metadata: { designId: design.id, type: rawType, sizeBytes: stored.sizeBytes },
      request: context.clientInfo,
    });

    // The first saree photograph triggers analysis (§8.4). Later photographs
    // re-run it so the analysis reflects everything the customer supplied.
    let analysisQueued = false;
    if (rawType === "SAREE_REFERENCE") {
      const { job } = await enqueueJob({
        designId: design.id,
        userId: context.userId,
        jobType: "SAREE_ANALYSIS",
        // Keyed by asset count so each new photograph re-analyses exactly once.
        idempotencyKey: `analysis:${design.id}:${existing + 1}`,
      });
      analysisQueued = true;
      context.log.info("Analysis queued", { jobId: job.id, designId: design.id });
      kickWorker();
    }

    const urls = await signedUrlsFor([stored.storageKey]);

    return created(
      {
        asset: {
          id: asset.id,
          type: asset.type,
          mimeType: asset.mime_type,
          width: asset.width,
          height: asset.height,
          originalFilename: asset.original_filename,
          url: urls.get(stored.storageKey) ?? null,
        },
        analysisQueued,
        remaining: limitFor(rawType) - (existing + 1),
      },
      context.requestId,
    );
  },
);

export const dynamic = "force-dynamic";
