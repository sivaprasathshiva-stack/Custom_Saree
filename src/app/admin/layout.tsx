import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Admin shell and authorization gate (requirements §34.3, §49).
 *
 * The gate lives in the layout so every page under /admin is covered by
 * construction — a new admin page cannot forget to check. The check reads
 * `profiles.is_admin` server-side on each request; a client-supplied flag is
 * never trusted anywhere.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle<{ is_admin: boolean }>();

  // Not an admin is reported as "not found", so the existence of the console
  // is not confirmed to a signed-in customer poking at URLs.
  if (!profile?.is_admin) redirect("/");

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-display text-lg">
              VELVOREA
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray">
              Design Team
            </span>
          </div>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/admin" className="hover:text-accent">
              Dashboard
            </Link>
            <Link href="/admin/design-requests" className="hover:text-accent">
              Queue
            </Link>
            <Link href="/studio" className="text-gray hover:text-accent">
              Studio
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
