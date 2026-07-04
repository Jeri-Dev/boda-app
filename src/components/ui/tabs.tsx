"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

export interface TabItem {
  href: string;
  label: string;
  /** Optional trailing count/badge. */
  count?: number;
  /** Exact-match the pathname instead of the default prefix-match. */
  exact?: boolean;
}

/**
 * TabNav — a route-driven tab bar. Active state comes from the current
 * pathname (prefix-match by default so nested routes stay active; `exact` for
 * the index tab). Used to present sibling sub-routes as one module.
 */
export function TabNav({
  items,
  className,
  ariaLabel = "Secciones",
}: {
  items: TabItem[];
  className?: string;
  ariaLabel?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "flex flex-wrap items-center gap-1 border-b border-[var(--color-border)]",
        className,
      )}
    >
      {items.map((t) => {
        const active = t.exact
          ? pathname === t.href
          : pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex items-center gap-1.5 whitespace-nowrap rounded-t-[var(--radius-sm)] border-b-2 px-3.5 py-2 text-sm transition-colors",
              active
                ? "border-[var(--color-accent)] text-[var(--color-foreground)]"
                : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
            )}
          >
            {t.label}
            {typeof t.count === "number" ? (
              <span
                className={cn(
                  "tabular-nums",
                  active
                    ? "text-[var(--color-muted-foreground)]"
                    : "text-[var(--color-stone-400)]",
                )}
              >
                {t.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
