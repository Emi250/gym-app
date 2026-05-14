"use client";

import { Dumbbell, History, House, ListChecks, LineChart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/routines", label: "Rutinas", icon: ListChecks },
  { href: "/train", label: "Entrenar", icon: Dumbbell, primary: true },
  { href: "/history", label: "Historial", icon: History },
  { href: "/stats", label: "Stats", icon: LineChart },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="bg-bg-elevated/95 border-border fixed bottom-0 left-0 right-0 z-20 border-t backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-center justify-between px-2">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
                  active ? "text-accent" : "text-fg-muted",
                  item.primary && !active && "text-fg",
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6",
                    item.primary && "h-7 w-7",
                    active && item.primary && "drop-shadow",
                  )}
                />
                <span className="uppercase tracking-wide">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
