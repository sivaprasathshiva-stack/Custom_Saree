/**
 * Route plumbing (requirements §34.2, §51.1, §60).
 *
 * Every Studio route goes through `withRoute`, so request id generation,
 * structured logging, timing and error sanitization happen once rather than
 * being re-implemented (and forgotten) per handler. Business logic never lives
 * in an HTTP handler (§60) — handlers validate, delegate, and shape a response.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DomainError } from "@/domain/errors";
import type { DesignStatus } from "@/domain/types";
import { isCustomerEditable } from "@/domain/design-state";
import { failFromUnknown, newRequestId } from "@/lib/api/response";
import { logger, type Logger } from "@/lib/observability/logger";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface RouteContext {
  requestId: string;
  request: NextRequest;
  log: Logger;
  supabase: SupabaseServerClient;
  /** Hashed into audit records; never stored raw (§29.15). */
  clientInfo: { ip: string | null; userAgent: string | null };
}

export interface AuthedRouteContext extends RouteContext {
  userId: string;
}

type Handler<C> = (context: C) => Promise<NextResponse>;

/** Next.js hands dynamic segments to a route handler as a promised object. */
type RouteSegment<P> = { params: Promise<P> };

type EmptyParams = Record<string, never>;

function clientInfoFrom(request: NextRequest): { ip: string | null; userAgent: string | null } {
  const forwarded = request.headers.get("x-forwarded-for");
  return {
    ip: forwarded ? forwarded.split(",")[0]?.trim() ?? null : null,
    userAgent: request.headers.get("user-agent"),
  };
}

/**
 * Wraps a handler with the cross-cutting concerns. Anything thrown inside
 * becomes a safe response; nothing escapes as an unhandled rejection.
 */
export function withRoute<P = EmptyParams>(
  route: string,
  handler: Handler<RouteContext & { params: P }>,
) {
  return async (request: NextRequest, segment?: RouteSegment<P>): Promise<NextResponse> => {
    const requestId = newRequestId();
    const startedAt = Date.now();
    const log = logger.child({ requestId, route });

    try {
      if (!isSupabaseConfigured()) {
        throw new DomainError("NOT_CONFIGURED");
      }

      const params = ((await segment?.params) ?? {}) as P;
      const supabase = await createClient();
      const response = await handler({
        requestId,
        request,
        log,
        supabase,
        clientInfo: clientInfoFrom(request),
        params,
      });

      log.info("Request completed", {
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      response.headers.set("x-request-id", requestId);
      return response;
    } catch (error) {
      const response = failFromUnknown(error, requestId, route);
      response.headers.set("x-request-id", requestId);
      log.info("Request failed", { status: response.status, durationMs: Date.now() - startedAt });
      return response;
    }
  };
}

/** Same, but rejects anonymous callers before the handler runs. */
export function withAuthedRoute<P = EmptyParams>(
  route: string,
  handler: Handler<AuthedRouteContext & { params: P }>,
) {
  return withRoute<P>(route, async (context) => {
    const {
      data: { user },
    } = await context.supabase.auth.getUser();

    if (!user) throw new DomainError("UNAUTHENTICATED");

    return handler({ ...context, userId: user.id });
  });
}

// --- resource loading with authorization ----------------------------------

export interface DesignRecord {
  id: string;
  user_id: string;
  name: string;
  status: DesignStatus;
  public_id: string | null;
  current_version_id: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Loads a design the caller owns.
 *
 * The `.eq("user_id")` filter is redundant given RLS — and that is the point.
 * §34.2 requires every resource lookup to verify ownership explicitly, so a
 * future policy change or a service-role call site cannot silently turn this
 * into an IDOR (§34.4).
 */
export async function requireOwnedDesign(
  context: AuthedRouteContext,
  designId: string,
): Promise<DesignRecord> {
  const { data, error } = await context.supabase
    .from("designs")
    .select("id, user_id, name, status, public_id, current_version_id, submitted_at, created_at, updated_at")
    .eq("id", designId)
    .eq("user_id", context.userId)
    .maybeSingle<DesignRecord>();

  if (error) {
    context.log.error("Design lookup failed", { designId, error });
    throw new DomainError("INTERNAL_ERROR", { cause: error });
  }
  // A design owned by someone else is reported as missing, not forbidden, so
  // the API never confirms that an id exists to someone without access.
  if (!data) throw new DomainError("DESIGN_NOT_FOUND");

  return data;
}

/** As above, and additionally refuses designs the customer may no longer edit. */
export async function requireEditableDesign(
  context: AuthedRouteContext,
  designId: string,
): Promise<DesignRecord> {
  const design = await requireOwnedDesign(context, designId);
  if (!isCustomerEditable(design.status)) {
    throw new DomainError("DESIGN_NOT_EDITABLE", { details: { status: design.status } });
  }
  return design;
}

/** Confirms the caller holds the internal admin flag (§34.3). */
export async function requireAdmin(context: AuthedRouteContext): Promise<void> {
  const { data, error } = await context.supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", context.userId)
    .maybeSingle<{ is_admin: boolean }>();

  if (error) throw new DomainError("INTERNAL_ERROR", { cause: error });
  if (!data?.is_admin) throw new DomainError("FORBIDDEN");
}

/** Parses a JSON body, converting malformed input into a clean 422. */
export async function readJson<T>(request: NextRequest): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new DomainError("VALIDATION_FAILED", { message: "The request body could not be read." });
  }
}
