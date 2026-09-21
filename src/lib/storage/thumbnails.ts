/**
 * Image derivatives (requirements §30.3).
 *
 * Concepts are generated at 2K. Serving that everywhere — My Designs grids,
 * version pickers, the admin queue — wastes the customer's bandwidth and our
 * egress for an image displayed 200px wide.
 *
 * Thumbnails are WebP: broadly supported, and materially smaller than JPEG at
 * the same perceptual quality.
 */

import sharp from "sharp";
import { logger } from "@/lib/observability/logger";

export const THUMBNAIL_WIDTH = 480;
export const THUMBNAIL_MIME = "image/webp";

export interface Derivative {
  bytes: Uint8Array;
  mimeType: string;
  width: number;
  height: number;
}

/**
 * Renders a thumbnail.
 *
 * Returns null rather than throwing: a missing thumbnail is cosmetic — the UI
 * falls back to the full image — whereas failing the job would throw away a
 * concept the customer already paid for in time and money.
 */
export async function createThumbnail(
  bytes: Uint8Array,
  options: { width?: number } = {},
): Promise<Derivative | null> {
  const width = options.width ?? THUMBNAIL_WIDTH;

  try {
    // `density` matters for SVG sources: without it sharp rasterizes at 72dpi
    // and the result is soft when scaled.
    const pipeline = sharp(Buffer.from(bytes), { density: 200 })
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 });

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

    return {
      bytes: new Uint8Array(data),
      mimeType: THUMBNAIL_MIME,
      width: info.width,
      height: info.height,
    };
  } catch (error) {
    logger.warn("Thumbnail generation failed; falling back to the full image", { error });
    return null;
  }
}
