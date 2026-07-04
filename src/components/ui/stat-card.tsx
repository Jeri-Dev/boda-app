import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils/cn";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  /** When set, the whole card is a link into the module. */
  href?: string;
  /** Render the value in the destructive color (e.g. negative remaining). */
  danger?: boolean;
  className?: string;
}

/**
 * StatCard — a compact metric tile for the dashboard grid. Extracted from the
 * inline card in the Panel so every surface shares one look. Links when `href`
 * is given, otherwise a plain surface.
 */
export function StatCard({
  label,
  value,
  sub,
  href,
  danger = false,
  className,
}: StatCardProps) {
  const surface = cn(
    "block rounded-[var(--radius-lg)] border border-[var(--color-border)]",
    "bg-[var(--color-card)] px-5 py-4 shadow-[var(--shadow-soft)]",
    href && "transition-colors hover:bg-[var(--color-muted)]",
    className,
  );

  const body = (
    <>
      <span className="text-[0.7rem] uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {label}
      </span>
      <span
        className={cn(
          "mt-1 block font-display text-2xl tabular-nums",
          danger
            ? "text-[var(--color-destructive)]"
            : "text-[var(--color-foreground)]",
        )}
      >
        {value}
      </span>
      {sub ? (
        <span className="mt-1 block text-xs text-[var(--color-muted-foreground)]">
          {sub}
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={surface}>
        {body}
      </Link>
    );
  }
  return <div className={surface}>{body}</div>;
}
