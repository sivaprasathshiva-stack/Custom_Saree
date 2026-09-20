import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { toCustomerStatusLabel } from "@/lib/studio/submission-status";

export const metadata = { title: "Design Requests — VELVOREA Admin" };

/**
 * Read-only design-requests list (PRD §38), explicitly scoped down per this
 * task: no assignment, notes, or the rest of the full designer workspace
 * (§39) — just Concept ID / Customer / Design / Material / Submitted /
 * Required By / Status / Priority.
 *
 * Access control: gated on `profiles.is_admin`, checked server-side here —
 * never trust a client-supplied flag. There is no admin UI yet to grant
 * this; it's a manual DB update:
 *   update public.profiles set is_admin = true where id = '<user-uuid>';
 */
export default async function DesignRequestsPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/studio");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) redirect("/studio");

  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, full_name, required_by_date, submitted_at, status, priority, design_id, designs(name, design)")
    .order("submitted_at", { ascending: false });

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16 text-ivory">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone">Admin</p>
      <h1 className="mt-2 font-serif text-3xl">Design Requests</h1>

      <div className="mt-8 overflow-x-auto border border-line-dark">
        <table className="w-full min-w-[900px] text-left font-mono text-xs">
          <thead className="border-b border-line-dark text-stone">
            <tr>
              <th className="px-3 py-2">Concept ID</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Design</th>
              <th className="px-3 py-2">Material</th>
              <th className="px-3 py-2">Submitted</th>
              <th className="px-3 py-2">Required By</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Priority</th>
            </tr>
          </thead>
          <tbody>
            {(submissions ?? []).map((s) => {
              const design = Array.isArray(s.designs) ? s.designs[0] : s.designs;
              const material = (design?.design as { materialId?: string } | null)?.materialId ?? "—";
              return (
                <tr key={s.id} className="border-b border-line-dark/50 text-ivory">
                  <td className="px-3 py-2">{s.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-3 py-2">{s.full_name}</td>
                  <td className="px-3 py-2">{design?.name ?? "—"}</td>
                  <td className="px-3 py-2">{material}</td>
                  <td className="px-3 py-2">{new Date(s.submitted_at).toLocaleDateString("en-IN")}</td>
                  <td className="px-3 py-2">{s.required_by_date}</td>
                  <td className="px-3 py-2">{toCustomerStatusLabel(s.status)}</td>
                  <td className="px-3 py-2 capitalize">{s.priority}</td>
                </tr>
              );
            })}
            {(submissions ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-stone">
                  No submissions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
