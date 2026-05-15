# UX Foundations Implementation Plan (Fase 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the missing design-system layer (tokens + reusable UI primitives) so Fase 3 can refactor screens without re-duplicating markup.

**Architecture:** Add design tokens to `app/globals.css` (Tailwind v4 `@theme` / `@utility`). Create 8 focused primitives in `components/ui/`, each one file, each with a colocated `.test.tsx`. Primitives mirror the exact markup duplicated across screens (documented in `docs/ux-audit-2026-05-15.md`). This phase **creates** primitives; it does **not** migrate screens to use them — that is Fase 3.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, `class-variance-authority` (CVA), Vitest + `@testing-library/react` + `@testing-library/user-event`, `lucide-react`.

---

## Conventions (read before starting)

- **Vitest has `globals: false`.** Every test file MUST import test helpers explicitly: `import { describe, it, expect, vi } from "vitest";`
- Test files are colocated next to source (e.g. `components/ui/card.test.tsx`). The include glob is `**/*.test.tsx`.
- React Testing Library render: `import { render, screen } from "@testing-library/react";`
- User interaction: `import userEvent from "@testing-library/user-event";`
- Class-merge helper already exists: `import { cn } from "@/lib/utils/cn";`
- Follow the existing CVA pattern in `components/ui/big-button.tsx` for variant-based primitives.
- Run a single test file with: `npm test -- components/ui/<file>.test.tsx`
- Run all tests with: `npm test`
- **Tailwind v4 note:** this repo's `AGENTS.md` warns the framework differs from training data. Before editing `app/globals.css` (Task 1), read `node_modules/tailwindcss/README.md` or the v4 theme docs to confirm `@theme` and `@utility` syntax.

## Scope

**In scope:** design tokens (shadows, radii, safe-area utilities); primitives `Card`, `Skeleton`, `IconButton`, `Chip`, `Switch`, `EmptyState`, `Field`/`Input`/`Select`, `ConfirmDialog`; the P0 focus fix for `NumberStepper`.

**Deferred (YAGNI):** `secondary`/`info`/`warning` color tokens — no screen needs them yet; add when a screen does. Animation/transition presets — defer to Fase 4 (polish), where the entry/feedback animations that consume them are designed. A standalone `focus-visible` utility class — unneeded, since each primitive embeds the `focus-visible:ring-2 focus-visible:ring-fg/40` classes directly. Migrating screens to consume the new primitives — that is Fase 3. The other three P0 findings (Train-live `target_sets` bug, missing error states, day-input label) are screen-level and belong to Fase 3.

**Note on token consumers:** of the tokens added in Task 1, only `--shadow-overlay` is consumed within this phase (by `ConfirmDialog`). `--shadow-card`, the radius scale, and the `*-safe` utilities are foundation pieces that Fase 3 consumes when it migrates `AppShell`, `BottomNav`, `RestTimer` and the cards. They are in scope here because laying the token layer is the explicit deliverable of this Foundations phase.

## File Structure

| File | Responsibility |
|------|----------------|
| `app/globals.css` (modify) | Add shadow + radius tokens and `pt-safe`/`pb-safe` utilities |
| `components/ui/card.tsx` (create) | Elevated container with padding variants |
| `components/ui/skeleton.tsx` (create) | Loading placeholder block |
| `components/ui/icon-button.tsx` (create) | Round icon-only button, `aria-label` required |
| `components/ui/chip.tsx` (create) | Pill toggle button (`active` state) |
| `components/ui/switch.tsx` (create) | Accessible on/off toggle (`role="switch"`) |
| `components/ui/empty-state.tsx` (create) | Icon + title + description + optional action |
| `components/ui/field.tsx` (create) | `Field` wrapper + styled `Input` + styled `Select` |
| `components/ui/confirm-dialog.tsx` (create) | Controlled confirmation modal |
| `components/ui/number-stepper.tsx` (modify) | Restore visible focus (P0 a11y fix) |
| `components/ui/*.test.tsx` (create) | One colocated test file per primitive |

---

## Task 1: Design tokens & safe-area utilities

**Files:**
- Modify: `app/globals.css`

This task has no unit test (CSS tokens). Verification is a passing build.

- [ ] **Step 1: Add shadow + radius tokens to the `@theme` block**

In `app/globals.css`, extend the existing `@theme { ... }` block (currently ends after `--font-mono`) so it reads:

```css
@theme {
  --color-bg: #0a0a0a;
  --color-bg-elevated: #141414;
  --color-bg-elevated-2: #1f1f1f;
  --color-border: #2a2a2a;
  --color-fg: #f5f5f5;
  --color-fg-muted: #a1a1aa;
  --color-accent: #22c55e;
  --color-accent-fg: #052e16;
  --color-danger: #ef4444;
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --shadow-card: 0 1px 2px rgb(0 0 0 / 0.4);
  --shadow-overlay: 0 8px 32px rgb(0 0 0 / 0.6);
  --radius-control: 0.75rem;
  --radius-card: 1rem;
}
```

- [ ] **Step 2: Add safe-area utilities after the `@theme` block**

Append to `app/globals.css` (after the `@theme` block, before the `html` rule):

```css
@utility pt-safe {
  padding-top: env(safe-area-inset-top);
}

@utility pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
```

- [ ] **Step 3: Verify the build compiles**

Run: `npm run build`
Expected: build completes with no CSS errors. (If `@utility` syntax errors, confirm the Tailwind v4 syntax in `node_modules/tailwindcss` docs and adjust.)

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "Add design tokens for shadows, radii and safe-area utilities"
```

---

## Task 2: `Skeleton` primitive

Replaces the repeated `bg-bg-elevated h-X animate-pulse rounded-2xl` (train, train/[id], routines, history, history/[id], stats).

**Files:**
- Create: `components/ui/skeleton.tsx`
- Test: `components/ui/skeleton.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/skeleton.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("renders an aria-hidden pulsing block", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("aria-hidden");
    expect(el.className).toContain("animate-pulse");
  });

  it("merges a custom className for sizing", () => {
    const { container } = render(<Skeleton className="h-32" />);
    expect((container.firstElementChild as HTMLElement).className).toContain("h-32");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/ui/skeleton.test.tsx`
Expected: FAIL — `Cannot find module './skeleton'`.

- [ ] **Step 3: Write the implementation**

```tsx
// components/ui/skeleton.tsx
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/** Loading placeholder. Size it with a `className` (e.g. `h-32`). */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("bg-bg-elevated animate-pulse rounded-2xl", className)}
      {...props}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/ui/skeleton.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ui/skeleton.tsx components/ui/skeleton.test.tsx
git commit -m "Add Skeleton UI primitive"
```

---

## Task 3: `Card` primitive

Replaces the ~20 repetitions of `bg-bg-elevated border-border rounded-2xl border p-X`.

**Files:**
- Create: `components/ui/card.tsx`
- Test: `components/ui/card.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/card.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>contenido</Card>);
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("applies the default medium padding", () => {
    const { container } = render(<Card>x</Card>);
    expect((container.firstElementChild as HTMLElement).className).toContain("p-4");
  });

  it("applies a chosen padding variant", () => {
    const { container } = render(<Card padding="lg">x</Card>);
    expect((container.firstElementChild as HTMLElement).className).toContain("p-5");
  });

  it("merges a custom className", () => {
    const { container } = render(<Card className="mt-2">x</Card>);
    expect((container.firstElementChild as HTMLElement).className).toContain("mt-2");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/ui/card.test.tsx`
Expected: FAIL — `Cannot find module './card'`.

- [ ] **Step 3: Write the implementation**

```tsx
// components/ui/card.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const cardStyles = cva("bg-bg-elevated border-border rounded-2xl border", {
  variants: {
    padding: { none: "", sm: "p-3", md: "p-4", lg: "p-5" },
  },
  defaultVariants: { padding: "md" },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardStyles> {}

/** Elevated, bordered container. The universal surface for content blocks. */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding, ...props }, ref) => (
    <div ref={ref} className={cn(cardStyles({ padding }), className)} {...props} />
  ),
);
Card.displayName = "Card";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/ui/card.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ui/card.tsx components/ui/card.test.tsx
git commit -m "Add Card UI primitive"
```

---

## Task 4: `IconButton` primitive

Replaces the round icon buttons (AppShell back, SyncBadge, settings links). `aria-label` is required at the type level.

**Files:**
- Create: `components/ui/icon-button.tsx`
- Test: `components/ui/icon-button.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/icon-button.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IconButton } from "./icon-button";

describe("IconButton", () => {
  it("exposes its accessible label", () => {
    render(<IconButton aria-label="Volver"><span /></IconButton>);
    expect(screen.getByRole("button", { name: "Volver" })).toBeInTheDocument();
  });

  it("has a visible focus ring class", () => {
    render(<IconButton aria-label="Volver"><span /></IconButton>);
    expect(screen.getByRole("button").className).toContain("focus-visible:ring");
  });

  it("applies the small size variant", () => {
    render(<IconButton aria-label="x" size="sm"><span /></IconButton>);
    expect(screen.getByRole("button").className).toContain("h-9");
  });

  it("calls onClick when pressed", async () => {
    const onClick = vi.fn();
    render(<IconButton aria-label="x" onClick={onClick}><span /></IconButton>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/ui/icon-button.test.tsx`
Expected: FAIL — `Cannot find module './icon-button'`.

- [ ] **Step 3: Write the implementation**

```tsx
// components/ui/icon-button.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const iconButtonStyles = cva(
  "flex shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors " +
    "hover:bg-bg-elevated hover:text-fg disabled:opacity-30 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40",
  {
    variants: {
      size: { sm: "h-9 w-9", md: "h-10 w-10" },
    },
    defaultVariants: { size: "md" },
  },
);

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonStyles> {
  /** Required: icon-only buttons must have an accessible name. */
  "aria-label": string;
}

/** Round icon-only button. Always pass `aria-label`. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(iconButtonStyles({ size }), className)}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/ui/icon-button.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ui/icon-button.tsx components/ui/icon-button.test.tsx
git commit -m "Add IconButton UI primitive"
```

---

## Task 5: `Chip` primitive

Replaces the duplicated pill button in `exercise-picker.tsx` and `stats/page.tsx`.

**Files:**
- Create: `components/ui/chip.tsx`
- Test: `components/ui/chip.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/chip.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chip } from "./chip";

describe("Chip", () => {
  it("renders its label", () => {
    render(<Chip>Pecho</Chip>);
    expect(screen.getByRole("button", { name: "Pecho" })).toBeInTheDocument();
  });

  it("reflects the active state via aria-pressed", () => {
    render(<Chip active>Pecho</Chip>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("defaults to not-pressed", () => {
    render(<Chip>Pecho</Chip>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("applies the accent style when active", () => {
    render(<Chip active>Pecho</Chip>);
    expect(screen.getByRole("button").className).toContain("bg-accent");
  });

  it("calls onClick when pressed", async () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Pecho</Chip>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/ui/chip.test.tsx`
Expected: FAIL — `Cannot find module './chip'`.

- [ ] **Step 3: Write the implementation**

```tsx
// components/ui/chip.tsx
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Highlights the chip with the accent color. */
  active?: boolean;
}

/** Pill-shaped toggle button used for filters and metric selectors. */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ active = false, className, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40",
        active ? "bg-accent text-accent-fg" : "bg-bg-elevated text-fg-muted",
        className,
      )}
      {...props}
    />
  ),
);
Chip.displayName = "Chip";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/ui/chip.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ui/chip.tsx components/ui/chip.test.tsx
git commit -m "Add Chip UI primitive"
```

---

## Task 6: `Switch` primitive

Replaces the native checkboxes with hardcoded `accent-green-500` (routines x4). Accessible toggle using `role="switch"`.

**Files:**
- Create: `components/ui/switch.tsx`
- Test: `components/ui/switch.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/switch.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "./switch";

describe("Switch", () => {
  it("exposes a switch role with the checked state", () => {
    render(<Switch checked onCheckedChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("reflects the unchecked state", () => {
    render(<Switch checked={false} onCheckedChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("calls onCheckedChange with the toggled value", async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not toggle when disabled", async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onChange} disabled />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/ui/switch.test.tsx`
Expected: FAIL — `Cannot find module './switch'`.

- [ ] **Step 3: Write the implementation**

```tsx
// components/ui/switch.tsx
import { cn } from "@/lib/utils/cn";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Associates the switch with an external `<label htmlFor>`. */
  id?: string;
  disabled?: boolean;
  className?: string;
}

/** Accessible on/off toggle. Controlled — pass `checked` and `onCheckedChange`. */
export function Switch({ checked, onCheckedChange, id, disabled, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40 " +
          "disabled:opacity-40",
        checked ? "bg-accent" : "bg-bg-elevated-2",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-fg transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/ui/switch.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ui/switch.tsx components/ui/switch.test.tsx
git commit -m "Add Switch UI primitive"
```

---

## Task 7: `EmptyState` primitive

Replaces the icon + title + text empty states scattered across train, history, stats, home, routines.

**Files:**
- Create: `components/ui/empty-state.tsx`
- Test: `components/ui/empty-state.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/empty-state.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dumbbell } from "lucide-react";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState icon={Dumbbell} title="Sin sesiones" />);
    expect(screen.getByText("Sin sesiones")).toBeInTheDocument();
  });

  it("renders the optional description", () => {
    render(
      <EmptyState icon={Dumbbell} title="Sin sesiones" description="Aparecerá acá" />,
    );
    expect(screen.getByText("Aparecerá acá")).toBeInTheDocument();
  });

  it("renders the optional action", () => {
    render(
      <EmptyState
        icon={Dumbbell}
        title="Sin sesiones"
        action={<button type="button">Crear</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Crear" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/ui/empty-state.test.tsx`
Expected: FAIL — `Cannot find module './empty-state'`.

- [ ] **Step 3: Write the implementation**

```tsx
// components/ui/empty-state.tsx
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional CTA rendered below the text (e.g. a button or link). */
  action?: ReactNode;
  className?: string;
}

/** Centered icon + title + description block for empty/zero-data screens. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "bg-bg-elevated border-border flex flex-col items-center gap-3 rounded-2xl border p-6 text-center",
        className,
      )}
    >
      <Icon className="text-fg-muted h-10 w-10" aria-hidden />
      <div>
        <p className="font-semibold">{title}</p>
        {description ? <p className="text-fg-muted mt-1 text-sm">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
```

> If `LucideIcon` is not exported by `lucide-react` v1.16.0, replace the import with
> `type LucideIcon = (props: { className?: string }) => ReactNode;` defined locally.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/ui/empty-state.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ui/empty-state.tsx components/ui/empty-state.test.tsx
git commit -m "Add EmptyState UI primitive"
```

---

## Task 8: `Field`, `Input`, `Select` primitives

Replaces the `Field` component duplicated in `routines/new` and `routines/[id]`, the native inputs with `focus:ring-white/20`, and the chevron-less `<select>` in stats.

**Files:**
- Create: `components/ui/field.tsx`
- Test: `components/ui/field.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/field.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field, Input, Select } from "./field";

describe("Field", () => {
  it("renders the label and child control", () => {
    render(
      <Field label="Nombre" htmlFor="name">
        <Input id="name" />
      </Field>,
    );
    expect(screen.getByText("Nombre")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
  });

  it("renders the optional hint", () => {
    render(
      <Field label="Fecha" hint="Cuándo empezás">
        <Input />
      </Field>,
    );
    expect(screen.getByText("Cuándo empezás")).toBeInTheDocument();
  });
});

describe("Input", () => {
  it("uses a focus-visible ring (not focus:)", () => {
    render(<Input aria-label="x" />);
    expect(screen.getByLabelText("x").className).toContain("focus-visible:ring");
  });
});

describe("Select", () => {
  it("renders its options and a chevron indicator", () => {
    const { container } = render(
      <Select aria-label="Ejercicio">
        <option value="a">A</option>
      </Select>,
    );
    expect(screen.getByLabelText("Ejercicio")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "A" })).toBeInTheDocument();
    // chevron svg is rendered as a sibling
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/ui/field.test.tsx`
Expected: FAIL — `Cannot find module './field'`.

- [ ] **Step 3: Write the implementation**

```tsx
// components/ui/field.tsx
import { ChevronDown } from "lucide-react";
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils/cn";

/** Shared control surface for text inputs and selects. */
const controlStyles =
  "bg-bg-elevated border-border h-14 w-full rounded-2xl border px-4 text-base " +
  "outline-none focus-visible:ring-2 focus-visible:ring-fg/40";

export interface FieldProps {
  label: string;
  hint?: string;
  /** Should match the `id` of the control rendered as a child. */
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

/** Label + control + optional hint, stacked vertically. */
export function Field({ label, hint, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-fg-muted text-xs font-medium uppercase tracking-wide"
      >
        {label}
      </label>
      {children}
      {hint ? <span className="text-fg-muted text-xs">{hint}</span> : null}
    </div>
  );
}

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Styled text input. */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(controlStyles, className)} {...props} />
  ),
);
Input.displayName = "Input";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Styled select with a visible chevron indicator. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(controlStyles, "appearance-none pr-10", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="text-fg-muted pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2"
      />
    </div>
  ),
);
Select.displayName = "Select";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/ui/field.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ui/field.tsx components/ui/field.test.tsx
git commit -m "Add Field, Input and Select UI primitives"
```

---

## Task 9: `ConfirmDialog` primitive

Replaces the 7 `window.confirm()` calls. Controlled component — the caller owns the `open` state.

**Files:**
- Create: `components/ui/confirm-dialog.tsx`
- Test: `components/ui/confirm-dialog.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/confirm-dialog.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./confirm-dialog";

const base = {
  title: "¿Borrar serie?",
  onConfirm: () => {},
  onCancel: () => {},
};

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    render(<ConfirmDialog {...base} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the title and description when open", () => {
    render(
      <ConfirmDialog {...base} open description="No se puede deshacer" />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("¿Borrar serie?")).toBeInTheDocument();
    expect(screen.getByText("No se puede deshacer")).toBeInTheDocument();
  });

  it("calls onConfirm when the confirm button is pressed", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog {...base} open onConfirm={onConfirm} confirmLabel="Borrar" />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Borrar" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when the cancel button is pressed", async () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...base} open onCancel={onCancel} cancelLabel="Cancelar" />);
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when Escape is pressed", async () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...base} open onCancel={onCancel} />);
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/ui/confirm-dialog.test.tsx`
Expected: FAIL — `Cannot find module './confirm-dialog'`.

- [ ] **Step 3: Write the implementation**

```tsx
// components/ui/confirm-dialog.tsx
"use client";

import { useEffect } from "react";
import { BigButton } from "@/components/ui/big-button";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in the danger color. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Controlled confirmation modal. Replaces `window.confirm()`.
 * The caller owns `open` and clears it inside `onConfirm`/`onCancel`.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-bg-elevated border-border w-full max-w-sm rounded-3xl border p-5 shadow-overlay"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? (
          <p className="text-fg-muted mt-1 text-sm">{description}</p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2">
          <BigButton
            variant={destructive ? "danger" : "primary"}
            size="md"
            onClick={onConfirm}
          >
            {confirmLabel}
          </BigButton>
          <BigButton variant="ghost" size="md" onClick={onCancel}>
            {cancelLabel}
          </BigButton>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/ui/confirm-dialog.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ui/confirm-dialog.tsx components/ui/confirm-dialog.test.tsx
git commit -m "Add ConfirmDialog UI primitive"
```

---

## Task 10: Restore visible focus on `NumberStepper` (P0 a11y fix)

The central input has `focus:ring-0` plus `outline-none`, so keyboard focus is invisible. Fix: ring the **container** with `focus-within` (the input keeps its hidden caret).

**Files:**
- Modify: `components/ui/number-stepper.tsx`
- Test: `components/ui/number-stepper.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/number-stepper.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberStepper } from "./number-stepper";

describe("NumberStepper", () => {
  it("shows a focus ring on the container via focus-within", () => {
    const { container } = render(<NumberStepper value={10} onChange={() => {}} />);
    // the bordered container is the div that holds the - input + buttons
    const box = container.querySelector(".rounded-2xl");
    expect(box?.className).toContain("focus-within:ring");
  });

  it("increments the value with the + button", async () => {
    const onChange = vi.fn();
    render(<NumberStepper value={10} onChange={onChange} step={5} />);
    await userEvent.click(screen.getByRole("button", { name: "Sumar 5" }));
    expect(onChange).toHaveBeenCalledWith(15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/ui/number-stepper.test.tsx`
Expected: FAIL — the first test fails because the container has no `focus-within:ring` class.

- [ ] **Step 3: Apply the fix**

In `components/ui/number-stepper.tsx`, find the container `div` (currently around line 72):

```tsx
      <div className="bg-bg-elevated border-border flex h-16 min-w-0 items-stretch rounded-2xl border">
```

Replace it with:

```tsx
      <div className="bg-bg-elevated border-border focus-within:ring-2 focus-within:ring-fg/40 flex h-16 min-w-0 items-stretch rounded-2xl border">
```

(Leave the input's `focus:ring-0` as-is — `caret-transparent` deliberately hides the caret; the container ring now provides the focus cue.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/ui/number-stepper.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ui/number-stepper.tsx components/ui/number-stepper.test.tsx
git commit -m "Restore visible keyboard focus on NumberStepper"
```

---

## Task 11: Final verification

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass (the 4 pre-existing logic tests + the 9 new primitive test files).

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: no type errors.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: no lint errors.

- [ ] **Step 4: Run the build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit any lint/format fixes if needed**

```bash
git add -A
git commit -m "Fix lint/format issues in UX primitives"
```

(Skip this commit if Steps 2-4 produced no changes.)

---

## Done criteria

- 8 new primitives exist in `components/ui/` with passing colocated tests.
- Design tokens (shadows, radii) and `pt-safe`/`pb-safe` utilities are in `app/globals.css`.
- `NumberStepper` shows a visible focus ring (P0 fixed).
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all pass.
- No screens were modified — migrating consumers is Fase 3.
