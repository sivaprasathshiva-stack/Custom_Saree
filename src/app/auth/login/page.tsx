import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { BackButton } from "@/components/ui/back-button";

export const metadata: Metadata = { title: "Sign in — VELVOREA" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-24">
      <BackButton className="mb-8 self-start" fallbackHref="/" />
      <h1 className="font-display text-3xl text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-gray">
        Access your saved designs, quotes and orders.
      </p>
      <AuthForm mode="sign-in" redirectTo={next ?? "/account"} />
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/auth/forgot-password" className="text-gray underline underline-offset-4 hover:text-ink">
          Forgot password?
        </Link>
        <Link href="/auth/sign-up" className="text-ink underline underline-offset-4">
          Create an account
        </Link>
      </div>
    </div>
  );
}
