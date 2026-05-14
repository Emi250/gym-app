"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthState } from "@/lib/auth/current-user";

const PUBLIC_PREFIXES = ["/login", "/auth/"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

/**
 * Wraps the app. Redirects to /login when there is no session and the route
 * is not public. Redirects to / when an authenticated user lands on /login.
 * Renders a minimal splash while the initial Supabase getSession() resolves.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthState();
  const pathname = usePathname();
  const router = useRouter();
  const onPublic = isPublic(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !onPublic) {
      router.replace("/login");
    } else if (user && pathname === "/login") {
      router.replace("/");
    }
  }, [user, loading, onPublic, pathname, router]);

  if (loading || (!user && !onPublic)) {
    return <Splash />;
  }
  return <>{children}</>;
}

function Splash() {
  return (
    <main className="flex min-h-svh items-center justify-center">
      <div className="border-fg/20 border-t-fg h-8 w-8 animate-spin rounded-full border-2" />
    </main>
  );
}
