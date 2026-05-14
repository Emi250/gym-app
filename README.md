# Gym Tracker PWA

Progressive Web App de registro de entrenamiento de fuerza optimizada para mobile, con sobrecarga progresiva automatizada (Double Progression).

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind 4 · Supabase (Postgres + Auth + RLS) · Dexie (IndexedDB offline-first) · Recharts · Vitest.

Design spec completo en `C:\Users\emili\.claude\plans\contexto-del-proyecto-mutable-swan.md`.

## Setup

```bash
pnpm install
cp .env.example .env.local   # completar con datos del proyecto Supabase
pnpm dev
```

Abrí http://localhost:3000.

## Comandos

| Script | Qué hace |
| ------ | -------- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm typecheck` | TypeScript en modo `--noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Tests con Vitest (one-shot) |
| `pnpm test:watch` | Vitest en modo watch |
| `pnpm format` | Prettier write |

## Supabase

1. Crear proyecto en https://app.supabase.com.
2. Habilitar provider de Google OAuth en Auth → Providers.
3. Aplicar las migraciones de `supabase/migrations/` (vía CLI `supabase db push`, o pegando el SQL en el SQL Editor en orden: `0001_init.sql`, después `0002_seed_catalog.sql`).
4. Copiar `URL` y `anon key` desde Settings → API a `.env.local`.

## Estructura

```
app/                  → rutas Next (App Router)
components/           → UI components
lib/db/               → Dexie schema + tipos compartidos con Supabase
lib/sync/             → sync engine + cliente Supabase
lib/progression/      → algoritmo Double Progression (puro)
lib/seed/             → catálogo de ejercicios precargado
lib/utils/            → helpers (cn, etc)
supabase/migrations/  → SQL de Postgres + RLS + seed
tests/                → setup y utilidades de testing
```

## Estado actual

Scaffolding listo. **Falta implementar:** páginas `/login`, `/train`, `/routines`, `/history`, `/stats`, `/settings`; sync engine; componentes UI grandes; integración Google OAuth; gráficos. Ver el design spec.
