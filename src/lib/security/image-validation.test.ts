import { describe, expect, it } from "vitest";
import { checksum, detectMimeType, probeImage, readDimensions } from "./image-validation";
import { MAX_UPLOAD_SIZE_BYTES, MIN_IMAGE_DIMENSION } from "@/config/limits";

function png(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0, 0, 0, 13], 8);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12); // "IHDR"
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return bytes;
}

function jpeg(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(20);
  bytes.set([0xff, 0xd8], 0); // SOI
  bytes.set([0xff, 0xc0], 2); // SOF0
  const view = new DataView(bytes.buffer);
  view.setUint16(4, 17); // segment length
  bytes[6] = 8; // sample precision
  view.setUint16(7, height);
  view.setUint16(9, width);
  return bytes;
}

/** A JPEG with an APP0 segment before the SOF, as every real camera writes. */
function jpegWithApp0(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(40);
  const view = new DataView(bytes.buffer);
  bytes.set([0xff, 0xd8], 0);
  bytes.set([0xff, 0xe0], 2); // APP0
  view.setUint16(4, 16); // APP0 length
  bytes.set([0xff, 0xc0], 20); // SOF0 after APP0
  view.setUint16(22, 17);
  bytes[24] = 8;
  view.setUint16(25, height);
  view.setUint16(27, width);
  return bytes;
}

function webpVp8x(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(32);
  bytes.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
  bytes.set([0x57, 0x45, 0x42, 0x50], 8); // "WEBP"
  bytes.set([0x56, 0x50, 0x38, 0x58], 12); // "VP8X"
  const w = width - 1;
  const h = height - 1;
  bytes[24] = w & 0xff;
  bytes[25] = (w >> 8) & 0xff;
  bytes[26] = (w >> 16) & 0xff;
  bytes[27] = h & 0xff;
  bytes[28] = (h >> 8) & 0xff;
  bytes[29] = (h >> 16) & 0xff;
  return bytes;
}

describe("detectMimeType", () => {
  it("identifies each supported format from its magic bytes", () => {
    expect(detectMimeType(png(800, 600))).toBe("image/png");
    expect(detectMimeType(jpeg(800, 600))).toBe("image/jpeg");
    expect(detectMimeType(webpVp8x(800, 600))).toBe("image/webp");
  });

  it("returns null for formats the pipeline cannot decode", () => {
    // HEIC ("ftypheic" box) — common from iPhones, explicitly unsupported (§8.1).
    const heic = new Uint8Array([
      0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63,
    ]);
    expect(detectMimeType(heic)).toBeNull();

    // A RIFF container that is not WebP (e.g. a WAV file).
    const wav = new Uint8Array(16);
    wav.set([0x52, 0x49, 0x46, 0x46], 0);
    wav.set([0x57, 0x41, 0x56, 0x45], 8);
    expect(detectMimeType(wav)).toBeNull();

    expect(detectMimeType(new Uint8Array([1, 2, 3]))).toBeNull();
    expect(detectMimeType(new Uint8Array(0))).toBeNull();
  });

  it("is not fooled by a renamed executable", () => {
    // "MZ" DOS header — a .exe renamed to .jpg.
    expect(detectMimeType(new Uint8Array([0x4d, 0x5a, 0x90, 0x00]))).toBeNull();
  });
});

describe("readDimensions", () => {
  it("reads PNG dimensions from IHDR", () => {
    expect(readDimensions(png(1920, 1080), "image/png")).toEqual({ width: 1920, height: 1080 });
  });

  it("reads JPEG dimensions from the start-of-frame marker", () => {
    expect(readDimensions(jpeg(1024, 768), "image/jpeg")).toEqual({ width: 1024, height: 768 });
  });

  it("walks past APP0 to find the real JPEG frame header", () => {
    expect(readDimensions(jpegWithApp0(4032, 3024), "image/jpeg")).toEqual({
      width: 4032,
      height: 3024,
    });
  });

  it("reads extended WebP canvas dimensions", () => {
    expect(readDimensions(webpVp8x(2000, 1500), "image/webp")).toEqual({
      width: 2000,
      height: 1500,
    });
  });

  it("returns null rather than guessing on truncated data", () => {
    expect(readDimensions(new Uint8Array(10), "image/png")).toBeNull();
    expect(readDimensions(new Uint8Array(4), "image/webp")).toBeNull();
  });
});

describe("probeImage", () => {
  it("accepts a valid photograph", () => {
    expect(probeImage(png(1200, 1800), "image/png")).toEqual({
      mimeType: "image/png",
      width: 1200,
      height: 1800,
      sizeBytes: 24,
    });
  });

  it("rejects an empty file", () => {
    expect(() => probeImage(new Uint8Array(0))).toThrow(/empty/i);
  });

  it("rejects a file above the size ceiling before parsing it", () => {
    const huge = new Uint8Array(MAX_UPLOAD_SIZE_BYTES + 1);
    expect(() => probeImage(huge)).toThrowError(
      expect.objectContaining({ code: "FILE_TOO_LARGE" }),
    );
  });

  it("rejects an unsupported format", () => {
    expect(() => probeImage(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8]))).toThrowError(
      expect.objectContaining({ code: "UNSUPPORTED_MEDIA_TYPE" }),
    );
  });

  it("rejects a file whose declared type contradicts its bytes", () => {
    expect(() => probeImage(png(800, 600), "image/jpeg")).toThrowError(
      expect.objectContaining({ code: "UNSUPPORTED_MEDIA_TYPE" }),
    );
  });

  it("rejects an image too small to work with", () => {
    expect(() => probeImage(png(MIN_IMAGE_DIMENSION - 1, 800))).toThrowError(
      expect.objectContaining({ code: "IMAGE_DIMENSIONS_INVALID" }),
    );
  });

  it("rejects an implausibly large image", () => {
    expect(() => probeImage(png(99999, 99999))).toThrowError(
      expect.objectContaining({ code: "IMAGE_DIMENSIONS_INVALID" }),
    );
  });

  it("carries a customer-safe message on every rejection", () => {
    try {
      probeImage(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8]));
      throw new Error("should have thrown");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toMatch(/JPG|PNG|WebP/i);
      expect(message).not.toMatch(/undefined|null|Error:/);
    }
  });
});

describe("checksum", () => {
  it("is stable for identical content and differs otherwise", async () => {
    const a = await checksum(png(800, 600));
    const b = await checksum(png(800, 600));
    const c = await checksum(png(801, 600));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});
