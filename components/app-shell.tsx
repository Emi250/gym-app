"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import { SyncBadge } from "./sync-badge";

interface AppShellProps {
  title?: string;
  /**
   * Back navigation:
   *  - string  → href (Link)
   *  - true    → router.back()
   *  - undefined → no back button
   */
  back?: string | true;
  /** Custom right-side action. Defaults to the sync badge. */
  topRight?: ReactNode;
  children: ReactNode;
}

/**
 * Mobile app shell: topbar (optional back + title + right action) +
 * scrollable content + fixed bottom nav. Children fill the middle area,
 * padded for safe-areas and bottom-nav height.
 */
export function AppShell({ title, back, topRight, children }: AppShellProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <header
        className="bg-bg/70 border-border sticky top-0 z-10 border-b backdrop-blur-lg"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-14 max-w-md items-center gap-1 px-2">
          <BackButton back={back} />
          <h1 className="flex-1 truncate px-2 text-lg font-semibold tracking-[-0.02em]">
            {title ?? "Gym Tracker"}
          </h1>
          {topRight ?? <SyncBadge />}
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}

function BackButton({ back }: { back: AppShellProps["back"] }) {
  const router = useRouter();
  if (back === undefined) {
    // Reserve the slot so the title alignment is consistent across pages.
    return <span aria-hidden className="w-10" />;
  }
  const Icon = <ChevronLeft className="h-5 w-5" />;
  const cls =
    "text-fg-muted hover:bg-bg-elevated-2 flex h-10 w-10 items-center justify-center rounded-full " +
    "border border-border bg-bg-elevated backdrop-blur-sm transition-colors";
  if (back === true) {
    return (
      <button type="button" aria-label="Volver" onClick={() => router.back()} className={cls}>
        {Icon}
      </button>
    );
  }
  return (
    <Link href={back} aria-label="Volver" className={cls}>
      {Icon}
    </Link>
  );
}
