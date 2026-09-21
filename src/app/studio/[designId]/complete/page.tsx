import { permanentRedirect } from "next/navigation";

/**
 * Legacy Concept Review route.
 *
 * The configurator's "Complete Design" step has been replaced by the woven
 * concept screen (§16), which is where a customer now reviews their design
 * before sending it. Kept as a permanent redirect so any bookmarked or
 * previously-shared link still lands somewhere correct.
 */
export default async function CompleteDesignPage({
  params,
}: {
  params: Promise<{ designId: string }>;
}) {
  const { designId } = await params;
  permanentRedirect(`/studio/${designId}/woven`);
}
