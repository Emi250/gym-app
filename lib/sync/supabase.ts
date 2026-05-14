import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Reads env vars from NEXT_PUBLIC_* so they ship
 * to the client bundle. RLS handles all authorization — no service-role usage here.
 *
 * Sessions are persisted in cookies (managed by `@supabase/ssr`) AND in
 * localStorage as a fallback. The browser auto-refreshes the access token via
 * the refresh token, so users stay logged in as long as the refresh token is
 * valid (controlled by the project's Auth settings in Supabase).
 */

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — see .env.example",
    );
  }
  _client = createBrowserClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Refresh tokens are rotated on every use; keep them in storage so they
      // survive across browser sessions / PWA relaunches.
      flowType: "pkce",
    },
    cookieOptions: {
      // 30 days. The browser client also stores tokens in localStorage; the
      // cookie is mostly there for SSR (we don't use that today) and as a
      // defence-in-depth secondary store.
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: typeof window !== "undefined" && window.location.protocol === "https:",
    },
  });
  return _client;
}
