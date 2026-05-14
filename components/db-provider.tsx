"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ensureLocalCatalogSeeded } from "@/lib/db/init";

/**
 * Wraps the app and ensures the Dexie store is initialized and the global
 * exercise catalog is seeded on first run. Children are rendered immediately
 * (seed is small and happens once), but a guard could be added if a flash
 * during seeding becomes visible.
 */
export function DbProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    ensureLocalCatalogSeeded().catch((e: unknown) => {
      console.error("Failed to seed local catalog", e);
      setError(e instanceof Error ? e : new Error(String(e)));
    });
  }, []);

  if (error) {
    return (
      <div className="bg-bg flex min-h-svh items-center justify-center p-6">
        <div className="border-danger max-w-sm rounded-2xl border p-5">
          <p className="text-danger font-semibold">No se pudo iniciar la base local</p>
          <p className="text-fg-muted mt-2 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
