"use client";

import { useSyncExternalStore } from "react";
import { authStore, type AuthState } from "./auth-store";
import { getSupabaseBrowserClient } from "@/lib/sync/supabase";

export function useAuthState(): AuthState {
  return useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getServerSnapshot,
  );
}

/** Returns the authenticated user's id, or null while loading / signed out. */
export function useCurrentUserId(): string | null {
  return useAuthState().user?.id ?? null;
}

/** Imperative helpers used from event handlers. */
export async function signInWithGoogle(redirectTo?: string) {
  const supabase = getSupabaseBrowserClient();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo ?? `${origin}/auth/callback`,
    },
  });
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
}
