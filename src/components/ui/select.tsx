import * as React from "react";

import { cn } from "@/lib/utils/cn";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Native <select> wrapped in a styled shell.
 *
 * Why native: the platform picker is fast, accessible, mobile-perfect, and
 * zero-bytes. Visual treatment matches Input so forms feel uniform.
 *
 * The chevron is an inline SVG painted into the background, sized in `em` so
 * it scales with text. Right padding leaves room for it.
 */
const selectBase = [
  "appearance-none",
  "flex h-11 w-full",
  "rounded-[var(--radius)]",
  "border border-[var(--color-input)]",
  "bg-[var(--color-card)]",
  "pl-3.5 pr-10 py-2",
  "text-[0.9375rem] text-[var(--color-foreground)]",
  "shadow-[var(--shadow-soft)]",
  "transition-[border-color,box-shadow,background-color] duration-150",
  "hover:border-[var(--color-stone-400)]",
  "focus-visible:outline-none",
  "focus-visible:border-[var(--color-ring)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-0",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "aria-invalid:border-[var(--color-destructive)]",
  "aria-invalid:focus-visible:ring-[var(--color-destructive)]",
  // Show empty-value option as muted (parity with placeholder).
  "[&:has(option:checked[value=''])]:text-[var(--color-muted-foreground)]",
].join(" ");

const chevronStyle: React.CSSProperties = {
  // Inline SVG chevron in a muted stone tone.
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'><path d='M1 1.5L6 6.5L11 1.5' stroke='%239a8c84' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 0.875rem center",
  backgroundSize: "0.75rem 0.5rem",
};

export function Select({ className, style, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(selectBase, className)}
      style={{ ...chevronStyle, ...style }}
      {...props}
    >
      {children}
    </select>
  );
}
