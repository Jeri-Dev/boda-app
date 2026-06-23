import * as React from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant =
  | "default"
  | "primary"
  | "outline"
  | "ghost"
  | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Render the button visually full-width. */
  block?: boolean;
}

const base = [
  "inline-flex items-center justify-center gap-2",
  "font-medium tracking-tight whitespace-nowrap",
  "rounded-[var(--radius)]",
  "transition-[background-color,color,box-shadow,transform] duration-150",
  "select-none",
  "disabled:pointer-events-none disabled:opacity-50",
  "aria-busy:cursor-progress",
  "active:translate-y-px",
].join(" ");

const variants: Record<ButtonVariant, string> = {
  // Deep plum-ink default — quiet, confident.
  default: [
    "bg-[var(--color-stone-800)] text-[var(--color-background)]",
    "shadow-[var(--shadow-soft)]",
    "hover:bg-[var(--color-stone-900)]",
    "active:shadow-[var(--shadow-press)]",
  ].join(" "),
  // Rose accent — for the highest-intent CTA on the page.
  primary: [
    "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]",
    "shadow-[var(--shadow-warm)]",
    "hover:brightness-[1.06]",
    "active:brightness-95 active:shadow-[var(--shadow-press)]",
  ].join(" "),
  outline: [
    "bg-transparent text-[var(--color-foreground)]",
    "border border-[var(--color-border)]",
    "hover:bg-[var(--color-muted)]",
  ].join(" "),
  ghost: [
    "bg-transparent text-[var(--color-foreground)]",
    "hover:bg-[var(--color-muted)]",
  ].join(" "),
  destructive: [
    "bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)]",
    "shadow-[var(--shadow-soft)]",
    "hover:brightness-[1.05]",
  ].join(" "),
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-13 px-7 text-base",
  icon: "h-10 w-10 p-0",
};

export function Button({
  className,
  variant = "default",
  size = "md",
  block = false,
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      // Explicit default — easy bug to ship a form-submitting toolbar button.
      type={type ?? "button"}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        block && "w-full",
        className,
      )}
      {...props}
    />
  );
}
