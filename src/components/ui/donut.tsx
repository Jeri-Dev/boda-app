import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface DonutProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Filled amount. */
  value: number;
  /** Total (the full ring). Values <= 0 render an empty ring, never NaN. */
  max: number;
  /** Diameter in px. */
  size?: number;
  /** Ring thickness in px. */
  thickness?: number;
  /** Big number rendered in the center; defaults to the rounded percentage. */
  centerLabel?: React.ReactNode;
  /** Small caption under the center number. */
  caption?: React.ReactNode;
  /** Accessible description of what the ring measures. */
  label: string;
}

/**
 * Donut — an inline-SVG progress ring (no chart library; the CSP blocks
 * external scripts). A warm track with an accent arc. `max <= 0` renders an
 * empty ring instead of dividing by zero.
 */
export function Donut({
  value,
  max,
  size = 132,
  thickness = 12,
  centerLabel,
  caption,
  label,
  className,
  ...props
}: DonutProps) {
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * pct;
  const center = size / 2;
  const display = centerLabel ?? `${Math.round(pct * 100)}%`;

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${Math.round(pct * 100)}%`}
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={thickness}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <span className="block font-display text-2xl tabular-nums text-[var(--color-foreground)]">
            {display}
          </span>
          {caption ? (
            <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">
              {caption}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
