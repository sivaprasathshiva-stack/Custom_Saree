/**
 * The single API response shape (requirements §27).
 *
 * Every route returns either { data, meta } or { error }. A stack trace, a
 * provider payload or a database error never reaches a client — `toErrorBody`
 * is the only way an error becomes a response, and it only ever serializes a
 * known code plus its safe message.
 */

import { NextResponse } from "next/server";
import { DomainError, type ErrorCode, errorMessage, errorStatus, isDomainError } from "@/domain/errors";
import { logger } from "@/lib/observability/logger";

export interface ApiMeta {
  requestId: string;
  [key: string]: unknown;
}

export interface ApiSuccess<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    retryable: boolean;
    requestId: string;
  };
}

export function newRequestId(): string {
  return crypto.randomUUID();
}

export function ok<T>(data: T, requestId: string, meta: Record<string, unknown> = {}): NextResponse {
  return NextResponse.json<ApiSuccess<T>>(
    { data, meta: { requestId, ...meta } },
    { status: 200 },
  );
}

export function created<T>(data: T, requestId: string): NextResponse {
  return NextResponse.json<ApiSuccess<T>>({ data, meta: { requestId } }, { status: 201 });
}

export function accepted<T>(data: T, requestId: string): NextResponse {
  return NextResponse.json<ApiSuccess<T>>({ data, meta: { requestId } }, { status: 202 });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

function toErrorBody(error: DomainError, requestId: string): ApiErrorBody {
  return {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
      retryable: error.retryable,
      requestId,
    },
  };
}

export function fail(
  code: ErrorCode,
  requestId: string,
  options: { message?: string; details?: Record<string, unknown> } = {},
): NextResponse {
  const error = new DomainError(code, options);
  return NextResponse.json<ApiErrorBody>(toErrorBody(error, requestId), { status: error.status });
}

/**
 * Converts anything thrown inside a route into a safe response.
 *
 * A DomainError is intentional and is passed through. Anything else is a bug
 * or an infrastructure failure: it is logged in full server-side and reported
 * to the client as a generic INTERNAL_ERROR carrying only the request id, so
 * support can still find it (§78) without leaking internals.
 */
export function failFromUnknown(error: unknown, requestId: string, route?: string): NextResponse {
  if (isDomainError(error)) {
    if (error.status >= 500) {
      logger.error("Request failed", { requestId, route, errorCode: error.code, error });
    } else {
      logger.warn("Request rejected", { requestId, route, errorCode: error.code, status: error.status });
    }
    return NextResponse.json<ApiErrorBody>(toErrorBody(error, requestId), { status: error.status });
  }

  logger.error("Unhandled route error", { requestId, route, error });
  const fallback = new DomainError("INTERNAL_ERROR");
  return NextResponse.json<ApiErrorBody>(toErrorBody(fallback, requestId), {
    status: errorStatus("INTERNAL_ERROR"),
  });
}

/** Convenience for the many places that need the canonical message text. */
export { errorMessage };
