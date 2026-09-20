import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { SubmissionForm } from "@/components/studio/submission-form";

export default async function SubmitDesignPage({
  params,
}: {
  params: Promise<{ designId: string }>;
}) {
  const { designId } = await params;

  if (!isSupabaseConfigured()) redirect("/studio");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/studio");

  const { data: row } = await supabase.from("designs").select("id, name").eq("id", designId).maybeSingle();
  if (!row) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-ivory">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone">Submit to VELVOREA</p>
      <h1 className="mt-2 font-serif text-3xl">Tell us where to send this</h1>
      <SubmissionForm designId={row.id} designName={row.name} />
    </main>
  );
}
