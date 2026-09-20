import { redirect } from "next/navigation";
import Link from "next/link";
import { PageIntro } from "@/components/marketing/page-intro";
import { BackButton } from "@/components/ui/back-button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { DeleteAccountButton } from "@/components/account/delete-account-button";
import { PhoneForm } from "@/components/account/phone-form";

export const metadata = { title: "Account — VELVOREA" };

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageIntro
        eyebrow="Account"
        title="Your designs, orders and documents in one place."
        description="Sign in to see saved designs, quotes, samples, orders and saree passports. Authentication is built but not yet connected to a live database in this environment."
        heroLabel="Account Dashboard"
        heroHint="Configure NEXT_PUBLIC_SUPABASE_URL / ANON_KEY to enable"
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/account");
  }

  const { data: designs } = await supabase
    .from("designs")
    .select("id, name, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone, country")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <BackButton className="mb-8" fallbackHref="/" />
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-gray">Account</p>
      <h1 className="mt-2 font-display text-3xl text-ink">{user.email}</h1>

      <section className="mt-12">
        <h2 className="font-display text-xl text-ink">Saved designs</h2>
        {designs && designs.length > 0 ? (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {designs.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm text-ink">{d.name}</p>
                  <p className="font-mono text-xs text-gray">
                    Updated {new Date(d.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <Link href="/studio" className="text-sm text-ink underline underline-offset-4">
                  Open in Studio
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-gray">
            No designs saved yet.{" "}
            <Link href="/studio" className="text-ink underline underline-offset-4">
              Start one in Studio
            </Link>
            .
          </p>
        )}
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-xl text-ink">Contact details</h2>
        <p className="mt-2 text-sm text-gray">
          Required before submitting a design to VELVOREA for production review.
        </p>
        <PhoneForm initialPhone={profile?.phone ?? ""} initialCountry={profile?.country ?? ""} />
      </section>

      <section className="mt-12 flex flex-wrap gap-6 border-t border-line pt-8 text-sm">
        <Link href="/orders" className="text-ink underline underline-offset-4">
          Orders
        </Link>
        <Link href="/passport" className="text-ink underline underline-offset-4">
          Saree passports
        </Link>
      </section>

      <form action="/auth/sign-out" method="post" className="mt-12">
        <button
          type="submit"
          className="border border-ink px-6 py-3 text-sm text-ink transition-colors duration-200 hover:bg-ink hover:text-paper active:scale-[0.97]"
        >
          Sign out
        </button>
      </form>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-xl text-ink">Danger zone</h2>
        <div className="mt-4">
          <DeleteAccountButton />
        </div>
      </section>
    </div>
  );
}
