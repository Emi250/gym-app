"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { BigButton } from "@/components/ui/big-button";
import { Card } from "@/components/ui/card";
import { signOut, useAuthState } from "@/lib/auth/current-user";
import { useSyncSnapshot } from "@/lib/sync/sync-store";

const STATUS_LABEL: Record<string, string> = {
  idle: "Sincronizado",
  syncing: "Sincronizando…",
  offline: "Sin conexión",
  error: "Error",
};

const fmtRelative = (iso: string | null): string => {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return `hace ${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hr = Math.round(min / 60);
  return `hace ${hr} h`;
};

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthState();
  const sync = useSyncSnapshot();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <AppShell title="Ajustes" back="/">
      <div className="flex flex-col gap-3">
        <Section label="Cuenta">
          <p className="font-medium">{user?.email ?? "—"}</p>
          <p className="text-fg-muted text-xs">{user?.user_metadata?.full_name ?? ""}</p>
        </Section>

        <Section label="Sincronización">
          <p className="font-medium">{STATUS_LABEL[sync.status] ?? sync.status}</p>
          <p className="text-fg-muted text-xs">Última: {fmtRelative(sync.lastSyncedAt)}</p>
          {sync.errorMessage ? (
            <p className="text-danger mt-1 text-xs">{sync.errorMessage}</p>
          ) : null}
        </Section>

        <Section label="Versión">
          <p className="font-medium">0.1.0</p>
        </Section>

        <BigButton
          variant="ghost"
          disabled={signingOut}
          onClick={async () => {
            setSigningOut(true);
            try {
              await signOut();
              router.replace("/login");
            } finally {
              setSigningOut(false);
            }
          }}
          className="text-danger mt-3"
        >
          <LogOut className="h-5 w-5" />
          {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
        </BigButton>
      </div>
    </AppShell>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card padding="md">
      <p className="text-fg-muted text-xs uppercase tracking-wide">{label}</p>
      <div className="mt-1">{children}</div>
    </Card>
  );
}
