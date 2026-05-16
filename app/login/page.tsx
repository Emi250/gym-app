"use client";

import { Dumbbell } from "lucide-react";
import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth/current-user";
import { showToast } from "@/lib/toast/toast-store";
import { BigButton } from "@/components/ui/big-button";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const [busy, setBusy] = useState(false);
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6">
      <Card
        padding="lg"
        className="flex w-full max-w-sm flex-col items-center gap-8 text-center"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="bg-accent/15 text-accent flex h-16 w-16 items-center justify-center rounded-card">
            <Dumbbell className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.02em]">Gym Tracker</h1>
          <p className="text-fg-muted max-w-xs text-sm">
            Registrá tus entrenamientos y dejá que la app calcule tu sobrecarga progresiva.
          </p>
        </div>

        <BigButton
          type="button"
          variant="primary"
          size="lg"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await signInWithGoogle();
            } catch (err) {
              console.error(err);
              showToast("No se pudo iniciar sesión. Reintentá.", "error");
              setBusy(false);
            }
          }}
        >
          <GoogleLogo />
          {busy ? "Redirigiendo…" : "Continuar con Google"}
        </BigButton>

        <p className="text-fg-muted max-w-xs text-xs">
          Tu progreso se guarda en tu cuenta y se sincroniza entre dispositivos.
        </p>
      </Card>
    </main>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 18 18" className="h-5 w-5" aria-hidden>
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
