"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { BigButton } from "@/components/ui/big-button";
import { useCurrentUserId } from "@/lib/auth/current-user";
import { createRoutine } from "@/lib/db/queries";
import { showToast } from "@/lib/toast/toast-store";

const today = () => new Date().toISOString().slice(0, 10);

export default function NewRoutinePage() {
  const router = useRouter();
  const userId = useCurrentUserId();
  const [name, setName] = useState("");
  const [startedAt, setStartedAt] = useState(today());
  const [activate, setActivate] = useState(true);
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && !!userId && !saving;

  async function handleSave() {
    if (!canSave || !userId) return;
    setSaving(true);
    try {
      const id = await createRoutine({
        user_id: userId,
        name: name.trim(),
        started_at: startedAt ? new Date(startedAt).toISOString() : null,
        activate,
      });
      showToast(`Rutina "${name.trim()}" creada`, "success");
      router.replace(`/routines/${id}`);
    } catch {
      showToast("No se pudo crear la rutina", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Nueva rutina" back="/routines">
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
      >
        <Field label="Nombre">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Push / Pull / Legs"
            className="bg-bg-elevated border-border h-14 w-full rounded-control border px-4 text-base outline-none transition-colors focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/40"
          />
        </Field>

        <Field
          label="Fecha de inicio"
          hint="¿Desde cuándo vas a seguir esta rutina? Driver del tracker de tiempo."
        >
          <input
            type="date"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className="bg-bg-elevated border-border h-14 w-full rounded-control border px-4 text-base outline-none transition-colors focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/40"
          />
        </Field>

        <label className="bg-bg-elevated border-border flex h-14 items-center justify-between rounded-control border px-4">
          <span className="text-sm font-medium">Activar al crear</span>
          <input
            type="checkbox"
            checked={activate}
            onChange={(e) => setActivate(e.target.checked)}
            className="accent-accent h-5 w-5"
          />
        </label>

        <BigButton type="submit" disabled={!canSave}>
          {saving ? "Guardando…" : "Crear rutina"}
        </BigButton>
      </form>
    </AppShell>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-fg-muted text-xs font-medium uppercase tracking-wide">{label}</span>
      {children}
      {hint ? <span className="text-fg-muted text-xs">{hint}</span> : null}
    </div>
  );
}
