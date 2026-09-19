"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full border border-line bg-paper px-4 py-3 text-sm text-ink placeholder:text-gray focus:border-ink focus:outline-none";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("done");
    setTimeout(() => {
      router.push("/account");
      router.refresh();
    }, 1500);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-24">
      <h1 className="font-display text-3xl text-ink">Set a new password</h1>

      {status === "done" ? (
        <p className="mt-8 border border-line bg-gray-light px-4 py-4 text-sm text-ink">
          Password updated. Taking you to your account…
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <input
            type="password"
            required
            minLength={8}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            autoComplete="new-password"
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
            {status === "loading" ? "Saving…" : "Update password"}
          </button>
        </form>
      )}
    </div>
  );
}
