/**
 * The compose-canvas document model (requirements §9.3, §10).
 *
 * Placement is stored in a resolution-independent 0..1 space (§10.1) so the
 * same composition renders identically on a phone, a desktop canvas and the
 * server-side generation pipeline. Nothing here stores pixels.
 *
 * Every mutation is a pure function returning a new composition, which is what
 * makes the undo/redo stack (§10.4) and the immutable version snapshots (§17)
 * possible without deep-cloning defensively at each call site.
 */

import { MAX_IDEA_IMAGES, MAX_TEXT_LENGTH } from "@/config/limits";

/** Bumped whenever the persisted shape changes incompatibly. */
export const COMPOSITION_SCHEMA_VERSION = 1;

export interface BoundingBox {
  /** Width as a fraction of the canvas, 0..1. */
  width: number;
  /** Height as a fraction of the canvas, 0..1. */
  height: number;
}

interface CompositionObjectBase {
  id: string;
  /** Centre point, normalized 0..1. */
  x: number;
  y: number;
  /** Multiplier applied to boundingBox. */
  scale: number;
  /** Degrees, normalized to 0..359. */
  rotation: number;
  /** 0..1. */
  opacity: number;
  zIndex: number;
  boundingBox: BoundingBox;
  locked: boolean;
  metadata: Record<string, unknown>;
}

export interface ImageObject extends CompositionObjectBase {
  type: "image";
  /** References a DesignAsset of type IDEA_IMAGE. Never inline binary data. */
  assetId: string;
}

export interface TextObject extends CompositionObjectBase {
  type: "text";
  text: string;
}

export type CompositionObject = ImageObject | TextObject;

export interface Composition {
  schemaVersion: number;
  objects: CompositionObject[];
}

export const SCALE_MIN = 0.05;
export const SCALE_MAX = 4;
export const OPACITY_MIN = 0;
export const OPACITY_MAX = 1;

/**
 * How far an object's centre may sit outside the canvas. A small bleed is
 * allowed so a motif can run off the edge of the saree, but an object can
 * never be dragged fully out of sight and lost (§10.3).
 */
export const MAX_BLEED = 0.1;
const POSITION_MIN = -MAX_BLEED;
const POSITION_MAX = 1 + MAX_BLEED;

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Normalize degrees into 0..359 so -90 and 270 are the same rotation. */
export function normalizeRotation(degrees: number): number {
  if (!Number.isFinite(degrees)) return 0;
  return ((degrees % 360) + 360) % 360;
}

export function emptyComposition(): Composition {
  return { schemaVersion: COMPOSITION_SCHEMA_VERSION, objects: [] };
}

function nextZIndex(composition: Composition): number {
  return composition.objects.reduce((max, object) => Math.max(max, object.zIndex), 0) + 1;
}

function constrain(object: CompositionObject): CompositionObject {
  return {
    ...object,
    x: clamp(object.x, POSITION_MIN, POSITION_MAX),
    y: clamp(object.y, POSITION_MIN, POSITION_MAX),
    scale: clamp(object.scale, SCALE_MIN, SCALE_MAX),
    rotation: normalizeRotation(object.rotation),
    opacity: clamp(object.opacity, OPACITY_MIN, OPACITY_MAX),
    boundingBox: {
      width: clamp(object.boundingBox.width, 0.01, 1),
      height: clamp(object.boundingBox.height, 0.01, 1),
    },
  };
}

function replaceObject(
  composition: Composition,
  id: string,
  update: (object: CompositionObject) => CompositionObject,
): Composition {
  let changed = false;
  const objects = composition.objects.map((object) => {
    if (object.id !== id || object.locked) return object;
    changed = true;
    return constrain(update(object));
  });
  return changed ? { ...composition, objects } : composition;
}

// --- construction ----------------------------------------------------------

export interface NewImageObjectInput {
  id: string;
  assetId: string;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  boundingBox?: BoundingBox;
}

export function createImageObject(input: NewImageObjectInput): ImageObject {
  return constrain({
    type: "image",
    id: input.id,
    assetId: input.assetId,
    x: input.x ?? 0.5,
    y: input.y ?? 0.5,
    scale: input.scale ?? 1,
    rotation: input.rotation ?? 0,
    opacity: 1,
    zIndex: 1,
    boundingBox: input.boundingBox ?? { width: 0.25, height: 0.25 },
    locked: false,
    metadata: {},
  }) as ImageObject;
}

export interface NewTextObjectInput {
  id: string;
  text: string;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
}

export function createTextObject(input: NewTextObjectInput): TextObject {
  return constrain({
    type: "text",
    id: input.id,
    text: input.text,
    x: input.x ?? 0.5,
    y: input.y ?? 0.75,
    scale: input.scale ?? 1,
    rotation: input.rotation ?? 0,
    opacity: 1,
    zIndex: 1,
    boundingBox: { width: 0.5, height: 0.08 },
    locked: false,
    metadata: {},
  }) as TextObject;
}

// --- mutations (§10.4 action set) -----------------------------------------

export function addObject(composition: Composition, object: CompositionObject): Composition {
  return {
    ...composition,
    objects: [...composition.objects, constrain({ ...object, zIndex: nextZIndex(composition) })],
  };
}

export function moveObject(
  composition: Composition,
  id: string,
  x: number,
  y: number,
): Composition {
  return replaceObject(composition, id, (object) => ({ ...object, x, y }));
}

export function scaleObject(composition: Composition, id: string, scale: number): Composition {
  return replaceObject(composition, id, (object) => ({ ...object, scale }));
}

export function rotateObject(composition: Composition, id: string, rotation: number): Composition {
  return replaceObject(composition, id, (object) => ({ ...object, rotation }));
}

export function deleteObject(composition: Composition, id: string): Composition {
  const objects = composition.objects.filter(
    (object) => object.id !== id || object.locked,
  );
  return objects.length === composition.objects.length ? composition : { ...composition, objects };
}

export function updateText(composition: Composition, id: string, text: string): Composition {
  return replaceObject(composition, id, (object) =>
    object.type === "text" ? { ...object, text } : object,
  );
}

export function resetComposition(): Composition {
  return emptyComposition();
}

// --- queries ---------------------------------------------------------------

export function findObject(composition: Composition, id: string): CompositionObject | undefined {
  return composition.objects.find((object) => object.id === id);
}

export function imageObjects(composition: Composition): ImageObject[] {
  return composition.objects.filter((object): object is ImageObject => object.type === "image");
}

export function textObjects(composition: Composition): TextObject[] {
  return composition.objects.filter((object): object is TextObject => object.type === "text");
}

/** A composition with nothing on it is valid but cannot be generated from. */
export function isEmpty(composition: Composition): boolean {
  return composition.objects.length === 0;
}

// --- validation (§13, §61) -------------------------------------------------

export interface CompositionValidationError {
  field: string;
  message: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateNumber(
  value: unknown,
  field: string,
  min: number,
  max: number,
  errors: CompositionValidationError[],
): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push({ field, message: `${field} must be a finite number.` });
    return;
  }
  if (value < min || value > max) {
    errors.push({ field, message: `${field} must be between ${min} and ${max}.` });
  }
}

/**
 * Validates an untrusted composition payload. The server runs this on every
 * write — client-side validation is a convenience, never the authority
 * (§13, §85 Rule 6).
 */
export function validateComposition(value: unknown): {
  valid: boolean;
  errors: CompositionValidationError[];
  composition?: Composition;
} {
  const errors: CompositionValidationError[] = [];

  if (!isPlainObject(value)) {
    return { valid: false, errors: [{ field: "composition", message: "Composition must be an object." }] };
  }

  if (value.schemaVersion !== COMPOSITION_SCHEMA_VERSION) {
    errors.push({
      field: "schemaVersion",
      message: `Unsupported composition schema version.`,
    });
  }

  if (!Array.isArray(value.objects)) {
    errors.push({ field: "objects", message: "Composition objects must be an array." });
    return { valid: false, errors };
  }

  const seenIds = new Set<string>();
  let imageCount = 0;

  value.objects.forEach((raw, index) => {
    const at = `objects[${index}]`;
    if (!isPlainObject(raw)) {
      errors.push({ field: at, message: "Each object must be an object." });
      return;
    }

    if (typeof raw.id !== "string" || raw.id.length === 0) {
      errors.push({ field: `${at}.id`, message: "Object id is required." });
    } else if (seenIds.has(raw.id)) {
      errors.push({ field: `${at}.id`, message: "Duplicate object id." });
    } else {
      seenIds.add(raw.id);
    }

    validateNumber(raw.x, `${at}.x`, POSITION_MIN, POSITION_MAX, errors);
    validateNumber(raw.y, `${at}.y`, POSITION_MIN, POSITION_MAX, errors);
    validateNumber(raw.scale, `${at}.scale`, SCALE_MIN, SCALE_MAX, errors);
    validateNumber(raw.rotation, `${at}.rotation`, 0, 359.999, errors);
    validateNumber(raw.opacity, `${at}.opacity`, OPACITY_MIN, OPACITY_MAX, errors);

    if (!isPlainObject(raw.boundingBox)) {
      errors.push({ field: `${at}.boundingBox`, message: "boundingBox is required." });
    } else {
      validateNumber(raw.boundingBox.width, `${at}.boundingBox.width`, 0.01, 1, errors);
      validateNumber(raw.boundingBox.height, `${at}.boundingBox.height`, 0.01, 1, errors);
    }

    if (raw.type === "image") {
      imageCount += 1;
      if (typeof raw.assetId !== "string" || raw.assetId.length === 0) {
        errors.push({ field: `${at}.assetId`, message: "Image objects need an assetId." });
      }
    } else if (raw.type === "text") {
      if (typeof raw.text !== "string") {
        errors.push({ field: `${at}.text`, message: "Text objects need text." });
      } else if (raw.text.trim().length > MAX_TEXT_LENGTH) {
        errors.push({
          field: `${at}.text`,
          message: `Text must be ${MAX_TEXT_LENGTH} characters or fewer.`,
        });
      }
    } else {
      errors.push({ field: `${at}.type`, message: "Object type must be image or text." });
    }
  });

  // §9.1 — at most one idea image may be placed on the saree. Enforced here
  // as well as at upload, because a composition can be posted directly.
  if (imageCount > MAX_IDEA_IMAGES) {
    errors.push({
      field: "objects",
      message: `Only ${MAX_IDEA_IMAGES} image can be added to your saree.`,
    });
  }

  if (errors.length > 0) return { valid: false, errors };

  const composition: Composition = {
    schemaVersion: COMPOSITION_SCHEMA_VERSION,
    objects: (value.objects as CompositionObject[]).map(constrain),
  };

  return { valid: true, errors: [], composition };
}

/** Asset ids the composition depends on, used to reject deleted references (§13). */
export function referencedAssetIds(composition: Composition): string[] {
  return imageObjects(composition).map((object) => object.assetId);
}
