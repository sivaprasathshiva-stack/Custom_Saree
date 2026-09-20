"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"] as const;

/**
 * Signs an authenticated customer out after 10 minutes with no interaction,
 * anywhere in the app. Mounted once in the root layout; a no-op for signed-out
 * visitors (checked via a real session read, not just "is Supabase configured").
 */
export function IdleLogout() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signedInRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) signedInRef.current = Boolean(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      signedInRef.current = Boolean(session);
    });

    async function handleIdleTimeout() {
      if (!signedInRef.current) return;
      await supabase.auth.signOut();
      router.push("/auth/login?reason=idle");
      router.refresh();
    }

    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(handleIdleTimeout, IDLE_TIMEOUT_MS);
    }

    resetTimer();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [router]);

  return null;
}
