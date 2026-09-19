import Image from "next/image";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

/**
 * Entry screen for the Textile Studio (requirements §5/§14). The Studio
 * itself requires a Google account so every design has a real owner from
 * the first save — the rest of the site's email/password auth is
 * untouched, this gate is Studio-specific.
 */
export function StudioSignInGate({ redirectTo = "/studio" }: { redirectTo?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-charcoal px-6 text-center text-ivory">
      <Link href="/" className="flex flex-col items-center gap-3">
        <Image
          src="/assets/brand/velvorea/velvorea-logo-white.png"
          alt="VELVOREA"
          width={56}
          height={56}
          className="h-12 w-12 object-contain"
          priority
        />
        <span className="font-display text-2xl tracking-wide">VELVOREA</span>
      </Link>

      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone">Textile Studio</p>
        <h1 className="mt-3 font-display text-3xl">Create your silk.</h1>
      </div>

      <GoogleSignInButton redirectTo={redirectTo} tone="dark" />

      <Link href="/" className="text-sm text-stone hover:text-ivory">
        Back to VELVOREA
      </Link>
    </div>
  );
}
