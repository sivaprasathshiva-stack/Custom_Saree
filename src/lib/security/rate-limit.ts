/**
 * Rate limiting (requirements §34.6, §65).
 *
 * Backed by a Postgres fixed-window counter rather than process memory: this
 * app runs on serverless instances, so an in-process counter resets on every
 * cold start and would wave through precisely the burst traffic it exists to
 * stop. See `consume_rate_limit` in supabase/schema.sql.
 *
 * Fail-open vs fail-closed: if the limiter itself is unavailable, requests are
 * allowed through and the failure is logged loudly. An outage in a protective
 * control should not take down the product; abuse during that window is
 * visible in the logs and bounded by the other limits (per-design concept
 * caps, per-user daily generation caps) which live in the database itself.
 */

import { RATE_LIMITS, type RateLimitKey } from "@/config/limits";
import { DomainError } from "@/domain/errors";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date | null;
  limit: number;
}

/**
 * Consumes one unit from a bucket.
 *
 * `subject` scopes the bucket — normally a user id. Never scope a limit by
 * something the client controls, such as a header it can change.
 */
export async function consumeRateLimit(
  key: RateLimitKey,
  subject: string,
): Promise<RateLimitResult> {
  const { limit, windowSeconds } = RATE_LIMITS[key];

  if (!isAdminConfigured()) {
    return { allowed: true, remaining: limit, resetAt: null, limit };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .rpc("consume_rate_limit", {
        p_bucket: `${key}:${subject}`,
        p_window_seconds: windowSeconds,
        p_limit: limit,
      })
      .single<{ allowed: boolean; remaining: number; reset_at: string }>();

    if (error || !data) {
      logger.error("Rate limiter unavailable — failing open", { rateLimitKey: key, error });
      return { allowed: true, remaining: limit, resetAt: null, limit };
    }

    return {
      allowed: data.allowed,
      remaining: data.remaining,
      resetAt: new Date(data.reset_at),
      limit,
    };
  } catch (error) {
    logger.error("Rate limiter threw — failing open", { rateLimitKey: key, error });
    return { allowed: true, remaining: limit, resetAt: null, limit };
  }
}

/** Consumes a unit and throws the standard 429 if the bucket is spent. */
export async function enforceRateLimit(key: RateLimitKey, subject: string): Promise<void> {
  const result = await consumeRateLimit(key, subject);
  if (result.allowed) return;

  const retryAfterSeconds = result.resetAt
    ? Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000))
    : RATE_LIMITS[key].windowSeconds;

  throw new DomainError("RATE_LIMITED", {
    details: { retryAfterSeconds, limit: result.limit },
  });
}
