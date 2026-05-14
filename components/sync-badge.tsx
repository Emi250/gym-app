"use client";

import { AlertCircle, Cloud, CloudOff, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSyncSnapshot } from "@/lib/sync/sync-store";

/**
 * Small status indicator placed in the topbar. Tapping it navigates to /settings
 * where the user can see the full sync state and last successful sync time.
 */
export function SyncBadge() {
  const { status } = useSyncSnapshot();

  const { icon, label } = (() => {
    switch (status) {
      case "syncing":
        return {
          icon: <RefreshCw className="text-fg-muted h-4 w-4 animate-spin" />,
          label: "Sincronizando",
        };
      case "offline":
        return {
          icon: <CloudOff className="text-fg-muted h-4 w-4" />,
          label: "Sin conexión",
        };
      case "error":
        return {
          icon: <AlertCircle className="text-danger h-4 w-4" />,
          label: "Error de sincronización",
        };
      case "idle":
      default:
        return {
          icon: <Cloud className="text-accent h-4 w-4" />,
          label: "Sincronizado",
        };
    }
  })();

  return (
    <Link
      href="/settings"
      aria-label={label}
      title={label}
      className="hover:bg-bg-elevated flex h-9 w-9 items-center justify-center rounded-full"
    >
      {icon}
    </Link>
  );
}
