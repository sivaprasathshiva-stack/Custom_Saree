import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { RevealObserver } from "@/components/marketing/reveal-observer";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Same server-client + profiles lookup pattern already used by /account —
  // reused here so the header can greet a signed-in user by name instead of
  // the static "Account" label.
  let accountLabel: string | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      accountLabel = profile?.full_name?.trim() || null;
    }
  }

  return (
    <>
      <SiteNav accountLabel={accountLabel} />
      <RevealObserver />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
