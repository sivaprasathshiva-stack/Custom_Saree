"use client";

/**
 * Browser-side API client.
 *
 * Every Studio fetch goes through here so the §27 envelope is unwrapped in one
 * place and errors arrive as a typed object carrying the code, the
 * customer-safe message, whether retrying is worth offering, and the request
 * id support will ask for (§78).
 */

export interface ApiFailure {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  requestId: string;
}

export class ApiError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly retryable: boolean;
  readonly requestId: string;
  readonly status: number;

  constructor(failure: ApiFailure, status: number) {
    super(failure.message);
    this.name = "ApiError";
    this.code = failure.code;
    this.details = failure.details;
    this.retryable = failure.retryable;
    this.requestId = failure.requestId;
    this.status = status;
  }
}

const NETWORK_FAILURE: ApiFailure = {
  code: "NETWORK_ERROR",
  message: "We couldn't reach VELVOREA. Check your connection and try again.",
  retryable: true,
  requestId: "",
};

async function parse<T>(response: Response): Promise<T> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // A non-JSON body from a proxy or gateway — treat as a generic failure.
  }

  if (!response.ok) {
    const failure = (body as { error?: ApiFailure } | null)?.error;
    throw new ApiError(
      failure ?? {
        ...NETWORK_FAILURE,
        message: "Something went wrong. Your design is safe.",
        requestId: response.headers.get("x-request-id") ?? "",
      },
      response.status,
    );
  }

  return (body as { data: T }).data;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, credentials: "same-origin" });
  } catch {
    // A genuine network failure, not an API rejection.
    throw new ApiError(NETWORK_FAILURE, 0);
  }
  return parse<T>(response);
}

export function apiGet<T>(url: string, signal?: AbortSignal): Promise<T> {
  return request<T>(url, { method: "GET", signal });
}

export function apiPost<T>(url: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
}

export function apiPut<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(url, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}

export function apiUpload<T>(url: string, form: FormData, signal?: AbortSignal): Promise<T> {
  // No content-type header: the browser must set the multipart boundary.
  return request<T>(url, { method: "POST", body: form, signal });
}

export interface JobSnapshot {
  id: string;
  status: "QUEUED" | "RUNNING" | "RETRYING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  stage: string | null;
  stageLabel: string | null;
  terminal: boolean;
  error: { code: string | null; message: string | null } | null;
  pollAfterMs: number | null;
}

/**
 * Polls a job to completion, backing off as instructed by the server (§33).
 * Resolves with the terminal snapshot — success or failure — rather than
 * throwing, so the caller can render the failure with a retry affordance.
 */
export async function pollJob(
  jobId: string,
  options: { signal?: AbortSignal; onUpdate?: (job: JobSnapshot) => void; timeoutMs?: number } = {},
): Promise<JobSnapshot> {
  const deadline = Date.now() + (options.timeoutMs ?? 5 * 60_000);

  for (;;) {
    const job = await apiGet<JobSnapshot>(`/api/studio/jobs/${jobId}`, options.signal);
    options.onUpdate?.(job);

    if (job.terminal) return job;

    if (Date.now() > deadline) {
      return {
        ...job,
        status: "FAILED",
        terminal: true,
        error: {
          code: "TIMEOUT",
          message: "This is taking longer than expected. Your design is safe — please try again.",
        },
      };
    }

    await new Promise((resolve) => setTimeout(resolve, job.pollAfterMs ?? 2000));
    if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");
  }
}
