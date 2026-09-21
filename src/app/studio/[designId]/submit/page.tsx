import { notFound, redirect } from "next/navigation";
import { StudioFrame } from "@/components/studio/studio-frame";
import { SubmissionForm } from "@/components/studio/submission-form";
import type { DesignStatus } from "@/domain/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Send to VELVOREA" };

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

  const { data: row } = await supabase
    .from("designs")
    .select("id, name, status, public_id, submitted_at")
    .eq("id", designId)
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      name: string;
      status: DesignStatus;
      public_id: string | null;
      submitted_at: string | null;
    }>();

  if (!row) notFound();

  // Already sent — there is nothing to submit twice (§55).
  if (row.submitted_at || row.status === "SUBMITTED") {
    redirect(`/studio/${designId}/woven`);
  }

  return (
    <StudioFrame step="submit" conceptId={row.public_id}>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-3xl">Send to VELVOREA</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-gray">
          Like what you&apos;ve created? Send your concept to our textile team for review and
          refinement.
        </p>
        <SubmissionForm designId={row.id} designName={row.name} />
      </div>
    </StudioFrame>
  );
}
