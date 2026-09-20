"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Profile phone/country (supabase/schema.sql `profiles.phone`/`country`,
 * already present since Phase 1). Judgment call (documented in
 * docs/textile-studio/18-prd-reconciliation.md): the PRD's journey diagram
 * gates phone verification before My Designs; this pass instead requires a
 * phone number at submission time (the submission form itself has a
 * required phone field, validated server-side in
 * src/lib/studio/submission-validation.ts) — no OTP/SMS verification yet,
 * that needs a provider decision. This account-page field just lets a
 * customer keep a phone number on their profile; it's optional here.
 */
export function PhoneForm({ initialPhone, initialCountry }: { initialPhone: string; initialCountry: string }) {
  const [phone, setPhone] = useState(initialPhone);
  const [country, setCountry] = useState(initialCountry);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  async function save() {
    setStatus("saving");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("failed");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ phone: phone.trim() || null, country: country.trim() || null })
      .eq("id", user.id);
    setStatus(error ? "failed" : "saved");
  }

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex flex-col text-sm text-ink">
        Phone
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 border border-line px-3 py-2 text-sm"
          placeholder="+91 98765 43210"
        />
      </label>
      <label className="flex flex-col text-sm text-ink">
        Country
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="mt-1 border border-line px-3 py-2 text-sm"
          placeholder="India"
        />
      </label>
      <button
        onClick={save}
        disabled={status === "saving"}
        className="border border-ink px-4 py-2 text-sm text-ink hover:bg-ink hover:text-paper disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Save"}
      </button>
      {status === "saved" && <span className="text-xs text-gray">Saved.</span>}
      {status === "failed" && <span className="text-xs text-red-600">Couldn&rsquo;t save. Try again.</span>}
    </div>
  );
}
