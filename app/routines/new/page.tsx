"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { BigButton } from "@/components/ui/big-button";
import { useCurrentUserId } from "@/lib/auth/current-user";
import { createRoutine } from "@/lib/db/queries";

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
      router.replace(`/routines/${id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Nueva rutina">
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
            className="bg-bg-elevated border-border h-14 w-full rounded-2xl border px-4 text-base outline-none focus:ring-2 focus:ring-white/20"
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
            className="bg-bg-elevated border-border h-14 w-full rounded-2xl border px-4 text-base outline-none focus:ring-2 focus:ring-white/20"
          />
        </Field>

        <label className="bg-bg-elevated border-border flex h-14 items-center justify-between rounded-2xl border px-4">
          <span className="text-sm font-medium">Activar al crear</span>
          <input
            type="checkbox"
            checked={activate}
            onChange={(e) => setActivate(e.target.checked)}
            className="h-5 w-5 accent-green-500"
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
