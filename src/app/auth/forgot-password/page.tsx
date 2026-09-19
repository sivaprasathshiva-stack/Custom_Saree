"use client";

import { useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const inputClass =
  "w-full border border-line bg-paper px-4 py-3 text-sm text-ink placeholder:text-gray focus:border-ink focus:outline-none";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    if (!isSupabaseConfigured()) {
      setStatus("error");
      setErrorMessage("Password reset isn't connected yet in this environment — the backend hasn't been configured.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        "/auth/reset-password",
      )}`,
    });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-24">
      <BackButton className="mb-8 self-start" fallbackHref="/auth/login" />
      <h1 className="font-display text-3xl text-ink">Reset your password</h1>
      <p className="mt-2 text-sm text-gray">
        We&rsquo;ll email you a link to set a new password.
      </p>

      {status === "sent" ? (
        <p className="mt-8 border border-line bg-gray-light px-4 py-4 text-sm text-ink">
          Check {email} for a password reset link.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            autoComplete="email"
          />
          {status === "error" && (
            <p className="text-sm text-red-700" role="alert">
              {errorMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center justify-center bg-ink px-6 py-3.5 text-sm font-medium text-paper transition-colors duration-200 hover:bg-ink-soft active:scale-[0.97] disabled:opacity-60"
          >
            {status === "loading" ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-gray">
        <Link href="/auth/login" className="text-ink underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
