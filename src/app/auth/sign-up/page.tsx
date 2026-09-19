import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { BackButton } from "@/components/ui/back-button";

export const metadata: Metadata = { title: "Create account — VELVOREA" };

export default function SignUpPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-24">
      <BackButton className="mb-8 self-start" fallbackHref="/" />
      <h1 className="font-display text-3xl text-ink">Create an account</h1>
      <p className="mt-2 text-sm text-gray">
        Save Studio designs to the cloud and track quotes and orders.
      </p>
      <AuthForm mode="sign-up" />
      <p className="mt-6 text-sm text-gray">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
