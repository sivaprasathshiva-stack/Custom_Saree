/**
 * Low-level Gemini API client (requirements §15.2).
 *
 * Talks to the `/v1beta/interactions` endpoint. Everything above this file
 * works in domain types; this is the only place that knows Google's wire
 * format, so replacing the vendor means replacing this folder and nothing
 * else (§85 Rule 7).
 *
 * Errors are classified, never passed through raw — a provider response can
 * contain the prompt, the customer's image, or hints about the API key.
 */

import { ProviderError } from "../types";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const PROVIDER = "gemini";

/**
 * Free tier: text and vision only. Image generation is paid-only on every
 * Gemini image model, which is why the image model is configured separately
 * and defaults to off — see `isImageGenerationEnabled`.
 *
 * `gemini-3.5-flash` rather than the newer `gemini-3.8-flash`: measured
 * against this project's key, 3.8 returned 503 "high demand" and 429 on two
 * of three consecutive calls, while 3.5 returned valid structured JSON on
 * every attempt. A customer's saree analysis failing because the newest model
 * is busy is not a trade worth making.
 */
export const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL ?? "gemini-3.5-flash";
export const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image";

/**
 * The only output type the image models accept. Requesting image/png returns
 * HTTP 400: "not supported for 'response_format.mime_type'".
 */
const IMAGE_OUTPUT_MIME = "image/jpeg";

export function geminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function isGeminiConfigured(): boolean {
  return geminiApiKey() !== null;
}

/**
 * Image generation requires billing on the Gemini account. It is opt-in so a
 * free-tier deployment cannot start failing every generation the moment it
 * goes live — see `AI_IMAGE_PROVIDER` in the registry.
 */
export function isImageGenerationEnabled(): boolean {
  return isGeminiConfigured() && process.env.AI_IMAGE_PROVIDER?.toUpperCase() === "GEMINI";
}

export type InteractionInput =
  | { type: "text"; text: string }
  | { type: "image"; mime_type: string; data: string };

export interface JsonSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  items?: unknown;
  [key: string]: unknown;
}

interface InteractionResponse {
  id?: string;
  output_text?: string;
  output_image?: { data?: string; mime_type?: string };
  steps?: Array<{ content?: Array<{ type?: string; text?: string; data?: string; mime_type?: string }> }>;
}

/**
 * A free-tier quota refusal is reported as 429 with a zero limit, which looks
 * exactly like ordinary throttling but will never succeed on retry. Detecting
 * it is what stops a concept job burning its whole retry budget against a
 * wall — §32.2: never retry a permanent failure.
 */
function isTierRefusal(body: string): boolean {
  return /free tier|upgrade your tier|limit: 0|billing|not available|paid/i.test(body);
}

function classify(status: number, body: string): ProviderError {
  // 429 and 5xx are worth retrying; a malformed request or a billing refusal
  // will fail identically forever, so §32.2 says never retry them.
  if (status === 429) {
    if (isTierRefusal(body)) {
      return new ProviderError(
        "This Gemini model is not available on the current plan. Enable billing on the API key to use image generation.",
        { retryable: false, provider: PROVIDER, reason: "BILLING_REQUIRED" },
      );
    }
    return new ProviderError("Gemini rate limit reached.", {
      retryable: true,
      provider: PROVIDER,
      reason: "RATE_LIMITED",
    });
  }
  if (status >= 500) {
    return new ProviderError("Gemini is unavailable.", {
      retryable: true,
      provider: PROVIDER,
      reason: "UPSTREAM_ERROR",
    });
  }
  if (status === 401 || status === 403) {
    return new ProviderError("Gemini rejected the API key.", {
      retryable: false,
      provider: PROVIDER,
      reason: "AUTH",
    });
  }
  // Billing refusals also arrive as 400s mentioning billing or quota.
  if (isTierRefusal(body)) {
    return new ProviderError(
      "This Gemini model requires billing to be enabled on the API key.",
      { retryable: false, provider: PROVIDER, reason: "BILLING_REQUIRED" },
    );
  }
  return new ProviderError("Gemini rejected the request.", {
    retryable: false,
    provider: PROVIDER,
    reason: "BAD_REQUEST",
  });
}

async function post(body: Record<string, unknown>, signal?: AbortSignal): Promise<InteractionResponse> {
  const key = geminiApiKey();
  if (!key) {
    throw new ProviderError("GEMINI_API_KEY is not configured.", {
      retryable: false,
      provider: PROVIDER,
      reason: "NOT_CONFIGURED",
    });
  }

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "x-goog-api-key": key, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) {
      throw new ProviderError("Gemini request timed out.", {
        retryable: true,
        provider: PROVIDER,
        reason: "TIMEOUT",
        cause: error,
      });
    }
    throw new ProviderError("Could not reach Gemini.", {
      retryable: true,
      provider: PROVIDER,
      reason: "NETWORK",
      cause: error,
    });
  }

  if (!response.ok) {
    // Read the body only to classify it. It is never surfaced or stored.
    const text = await response.text().catch(() => "");
    throw classify(response.status, text);
  }

  try {
    return (await response.json()) as InteractionResponse;
  } catch (error) {
    throw new ProviderError("Gemini returned an unreadable response.", {
      retryable: true,
      provider: PROVIDER,
      reason: "BAD_OUTPUT",
      cause: error,
    });
  }
}

/** Reads generated text, tolerating either the convenience field or the steps array. */
function readText(response: InteractionResponse): string | null {
  if (typeof response.output_text === "string" && response.output_text.length > 0) {
    return response.output_text;
  }
  const steps = response.steps ?? [];
  for (let i = steps.length - 1; i >= 0; i -= 1) {
    for (const part of steps[i]?.content ?? []) {
      if (part?.type === "text" && typeof part.text === "string" && part.text.length > 0) {
        return part.text;
      }
    }
  }
  return null;
}

function readImage(response: InteractionResponse): { data: string; mimeType: string } | null {
  if (response.output_image?.data) {
    return {
      data: response.output_image.data,
      mimeType: response.output_image.mime_type ?? IMAGE_OUTPUT_MIME,
    };
  }
  // The live API does not populate the documented convenience fields, so the
  // steps array is the real source, not a fallback.
  for (const step of response.steps ?? []) {
    for (const part of step?.content ?? []) {
      if (part?.data) return { data: part.data, mimeType: part.mime_type ?? IMAGE_OUTPUT_MIME };
    }
  }
  return null;
}

/** Requests structured JSON and parses it against the supplied shape. */
export async function generateJson<T>(params: {
  input: InteractionInput[];
  schema: JsonSchema;
  model?: string;
  signal?: AbortSignal;
}): Promise<T> {
  const response = await post(
    {
      model: params.model ?? GEMINI_TEXT_MODEL,
      input: params.input,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: params.schema,
      },
    },
    params.signal,
  );

  const text = readText(response);
  if (!text) {
    throw new ProviderError("Gemini returned no content.", {
      retryable: true,
      provider: PROVIDER,
      reason: "EMPTY_OUTPUT",
    });
  }

  try {
    // Models occasionally wrap JSON in a code fence despite the schema.
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    return JSON.parse(cleaned) as T;
  } catch (error) {
    throw new ProviderError("Gemini returned malformed JSON.", {
      retryable: true,
      provider: PROVIDER,
      reason: "BAD_OUTPUT",
      cause: error,
    });
  }
}

export interface GeneratedImageBytes {
  bytes: Uint8Array;
  mimeType: string;
}

/** Requests an image, optionally editing supplied source images. */
export async function generateImage(params: {
  input: InteractionInput[];
  aspectRatio?: string;
  imageSize?: string;
  model?: string;
  signal?: AbortSignal;
}): Promise<GeneratedImageBytes> {
  const response = await post(
    {
      model: params.model ?? GEMINI_IMAGE_MODEL,
      input: params.input,
      response_format: {
        type: "image",
        mime_type: IMAGE_OUTPUT_MIME,
        ...(params.aspectRatio ? { aspect_ratio: params.aspectRatio } : {}),
        ...(params.imageSize ? { image_size: params.imageSize } : {}),
      },
    },
    params.signal,
  );

  const image = readImage(response);
  if (!image?.data) {
    // A refusal (safety, policy) also lands here — the model returns text
    // explaining itself instead of an image.
    throw new ProviderError("Gemini did not return an image.", {
      retryable: false,
      provider: PROVIDER,
      reason: "REFUSED_OR_EMPTY",
    });
  }

  return { bytes: decodeBase64(image.data), mimeType: image.mimeType };
}

export function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, "base64"));
}

export function encodeBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

export const GEMINI_PROVIDER_NAME = PROVIDER;
