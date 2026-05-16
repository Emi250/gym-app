"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/sync/supabase";
import { Card } from "@/components/ui/card";

/**
 * Handles the OAuth redirect from Supabase. With PKCE flow, Supabase sends the
 * user back here with a `?code=...` query param; we exchange it for a session.
 * Once the session is set, the AuthStore picks it up via onAuthStateChange and
 * the AuthGate moves us out of `/login`.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const errorDescription = url.searchParams.get("error_description");

    if (errorDescription) {
      // Surface Google's failure via a query param on login (no setState in effect body).
      router.replace(`/login?error=${encodeURIComponent(errorDescription)}`);
      return;
    }

    if (!code) {
      // The browser client also reads the hash (#access_token=...) automatically
      // for implicit flows — if a session shows up shortly, redirect home.
      void supabase.auth.getSession().then((res: { data: { session: unknown } }) => {
        if (res.data.session) router.replace("/");
        else setError("No se encontró el código de autenticación.");
      });
      return;
    }

    void supabase.auth
      .exchangeCodeForSession(code)
      .then((res: { error: { message: string } | null }) => {
        if (res.error) {
          setError(res.error.message);
        } else {
          router.replace("/");
        }
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
      });
  }, [router]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6">
      <Card
        padding="lg"
        className="flex w-full max-w-sm flex-col items-center gap-4 text-center"
      >
        {error ? (
          <>
            <p className="text-danger font-semibold">No se pudo iniciar sesión</p>
            <p className="text-fg-muted max-w-xs text-sm">{error}</p>
            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="text-accent text-sm underline"
            >
              Volver a intentar
            </button>
          </>
        ) : (
          <>
            <div className="border-fg/20 border-t-fg h-8 w-8 animate-spin rounded-full border-2" />
            <p className="text-fg-muted text-sm">Conectando…</p>
          </>
        )}
      </Card>
    </main>
  );
}
