"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Two-step (click to arm, click to confirm) delete control so this isn't a
 * single accidental click away — calls the server route in
 * src/app/api/account/delete/route.ts, which cascades designs/versions via
 * the existing `on delete cascade` FKs.
 */
export function DeleteAccountButton() {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [status, setStatus] = useState<"idle" | "deleting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setStatus("deleting");
    setError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't delete your account. Try again.");
        setStatus("error");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error — couldn't reach the server.");
      setStatus("error");
    }
  }

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="border border-danger/40 px-6 py-3 text-sm text-danger transition-colors duration-200 hover:bg-danger/10"
      >
        Delete account
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3 border border-danger/40 bg-danger/5 p-4">
      <p className="text-sm text-ink">
        This permanently deletes your account, saved designs, and version history. This cannot
        be undone.
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={status === "deleting"}
          className="border border-danger bg-danger px-5 py-2.5 text-sm text-paper transition-colors disabled:opacity-50"
        >
          {status === "deleting" ? "Deleting…" : "Yes, permanently delete"}
        </button>
        <button
          type="button"
          onClick={() => setArmed(false)}
          disabled={status === "deleting"}
          className="border border-line px-5 py-2.5 text-sm text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
