import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import { SyncBadge } from "./sync-badge";

interface AppShellProps {
  title?: string;
  /** Custom right-side action. Defaults to the sync badge. */
  topRight?: ReactNode;
  children: ReactNode;
}

/**
 * Mobile app shell: topbar + scrollable content + fixed bottom nav.
 * Children fill the middle area; padded for safe areas + nav height.
 */
export function AppShell({ title, topRight, children }: AppShellProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <header
        className="bg-bg/85 border-border sticky top-0 z-10 border-b backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <h1 className="text-lg font-semibold tracking-tight">{title ?? "Gym Tracker"}</h1>
          {topRight ?? <SyncBadge />}
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}
