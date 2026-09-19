import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "Account — VELVOREA" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="Account"
      title="Your designs, orders and documents in one place."
      description="Sign in to see saved designs, quotes, samples, orders and saree passports. Authentication isn't wired up in this prototype yet."
      heroLabel="Account Dashboard"
      heroHint="Product screenshot once auth/account is built"
    />
  );
}
