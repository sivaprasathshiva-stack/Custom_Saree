/**
 * Server-side image validation (requirements §8.2, §34.5, §63).
 *
 * The client's declared MIME type and dimensions are advisory — a browser can
 * claim anything, and §85 Rule 6 says never trust the client. Everything here
 * works from the file's actual bytes: the magic number decides the format, and
 * the dimensions are read out of the image header rather than taken on faith.
 *
 * This deliberately avoids a native image library. Parsing only the header of
 * three known formats is a much smaller attack surface than handing an
 * arbitrary upload to a full decoder, and it runs anywhere without a binary
 * dependency.
 */

import {
  MAX_IMAGE_DIMENSION,
  MAX_UPLOAD_SIZE_BYTES,
  MIN_IMAGE_DIMENSION,
  SUPPORTED_UPLOAD_MIME_TYPES,
  type SupportedUploadMimeType,
} from "@/config/limits";
import { DomainError } from "@/domain/errors";

export interface ImageProbe {
  mimeType: SupportedUploadMimeType;
  width: number;
  height: number;
  sizeBytes: number;
}

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46]; // "RIFF"
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50]; // "WEBP"

/** Detects the true format from magic bytes, ignoring any declared type. */
export function detectMimeType(bytes: Uint8Array): SupportedUploadMimeType | null {
  if (startsWith(bytes, PNG_SIGNATURE)) return "image/png";
  if (startsWith(bytes, JPEG_SIGNATURE)) return "image/jpeg";
  if (startsWith(bytes, RIFF_SIGNATURE) && startsWith(bytes, WEBP_SIGNATURE, 8)) return "image/webp";
  return null;
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  );
}

function readUint16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function pngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  // IHDR is always the first chunk: 8-byte signature, 4-byte length,
  // 4-byte type, then width and height as big-endian uint32.
  if (bytes.length < 24) return null;
  if (String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]) !== "IHDR") return null;
  return { width: readUint32BE(bytes, 16), height: readUint32BE(bytes, 20) };
}

function jpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  // Walk the marker segments to the Start Of Frame, which carries the real
  // dimensions. Progressive and baseline JPEGs use different SOF markers.
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];

    // Standalone markers carry no length payload.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    // Start of scan — image data begins, no SOF was found.
    if (marker === 0xda) return null;

    const length = readUint16BE(bytes, offset + 2);
    if (length < 2) return null;

    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      if (offset + 9 >= bytes.length) return null;
      return { height: readUint16BE(bytes, offset + 5), width: readUint16BE(bytes, offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

function webpDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 30) return null;
  const format = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);

  if (format === "VP8 ") {
    // Lossy: dimensions sit after the 3-byte start code in the frame header.
    return { width: readUint16LE(bytes, 26) & 0x3fff, height: readUint16LE(bytes, 28) & 0x3fff };
  }

  if (format === "VP8L") {
    // Lossless: width and height are 14 bits each, packed little-endian
    // immediately after the 1-byte signature, and stored minus one.
    const bits = (bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24)) >>> 0;
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }

  if (format === "VP8X") {
    // Extended: 24-bit little-endian canvas size, stored minus one.
    return { width: readUint24LE(bytes, 24) + 1, height: readUint24LE(bytes, 27) + 1 };
  }

  return null;
}

export function readDimensions(
  bytes: Uint8Array,
  mimeType: SupportedUploadMimeType,
): { width: number; height: number } | null {
  switch (mimeType) {
    case "image/png":
      return pngDimensions(bytes);
    case "image/jpeg":
      return jpegDimensions(bytes);
    case "image/webp":
      return webpDimensions(bytes);
  }
}

/**
 * Full upload gate. Throws a DomainError carrying customer-safe copy, so a
 * route can pass the failure straight through to the response.
 */
export function probeImage(bytes: Uint8Array, declaredMimeType?: string): ImageProbe {
  if (bytes.byteLength === 0) {
    throw new DomainError("UNSUPPORTED_MEDIA_TYPE", { message: "That file appears to be empty." });
  }

  if (bytes.byteLength > MAX_UPLOAD_SIZE_BYTES) {
    throw new DomainError("FILE_TOO_LARGE", {
      details: { maxBytes: MAX_UPLOAD_SIZE_BYTES, actualBytes: bytes.byteLength },
    });
  }

  const mimeType = detectMimeType(bytes);
  if (!mimeType) {
    // HEIC is the common case here: iPhones produce it, and §8.1 says reject
    // it explicitly rather than accept a file the pipeline cannot decode.
    throw new DomainError("UNSUPPORTED_MEDIA_TYPE", {
      details: { supported: SUPPORTED_UPLOAD_MIME_TYPES, declared: declaredMimeType ?? null },
    });
  }

  // A mismatch between the declared and actual type is a red flag worth
  // rejecting rather than quietly correcting.
  if (declaredMimeType && declaredMimeType !== mimeType) {
    throw new DomainError("UNSUPPORTED_MEDIA_TYPE", {
      message: "That file doesn't look like the image type it claims to be.",
      details: { declared: declaredMimeType, detected: mimeType },
    });
  }

  const dimensions = readDimensions(bytes, mimeType);
  if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) {
    throw new DomainError("IMAGE_DIMENSIONS_INVALID", {
      message: "We couldn't read that image. Please try a different photo.",
    });
  }

  if (dimensions.width < MIN_IMAGE_DIMENSION || dimensions.height < MIN_IMAGE_DIMENSION) {
    throw new DomainError("IMAGE_DIMENSIONS_INVALID", {
      details: { minimum: MIN_IMAGE_DIMENSION, width: dimensions.width, height: dimensions.height },
    });
  }

  if (dimensions.width > MAX_IMAGE_DIMENSION || dimensions.height > MAX_IMAGE_DIMENSION) {
    throw new DomainError("IMAGE_DIMENSIONS_INVALID", {
      message: "That image is larger than we can process. Please use a smaller photo.",
      details: { maximum: MAX_IMAGE_DIMENSION, width: dimensions.width, height: dimensions.height },
    });
  }

  return { mimeType, width: dimensions.width, height: dimensions.height, sizeBytes: bytes.byteLength };
}

/** Content checksum, used for asset integrity (§53) and duplicate detection. */
export async function checksum(bytes: Uint8Array): Promise<string> {
  const source = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const digest = await crypto.subtle.digest("SHA-256", source);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
