import * as React from "react";

import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const inputBase = [
  "flex h-11 w-full",
  "rounded-[var(--radius)]",
  "border border-[var(--color-input)]",
  "bg-[var(--color-card)]",
  "px-3.5 py-2",
  "text-[0.9375rem] text-[var(--color-foreground)]",
  "placeholder:text-[var(--color-muted-foreground)]",
  "shadow-[var(--shadow-soft)]",
  "transition-[border-color,box-shadow,background-color] duration-150",
  "hover:border-[var(--color-stone-400)]",
  "focus-visible:outline-none",
  "focus-visible:border-[var(--color-ring)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-0",
  "disabled:cursor-not-allowed disabled:opacity-60",
  // Invalid state — picked up automatically when the parent Field sets aria-invalid.
  "aria-invalid:border-[var(--color-destructive)]",
  "aria-invalid:focus-visible:ring-[var(--color-destructive)]",
  // File input nicety.
  "file:border-0 file:bg-transparent file:text-sm file:font-medium",
].join(" ");

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input type={type} className={cn(inputBase, className)} {...props} />
  );
}

// Export the shared class string so Textarea / Select can mirror styling.
export const inputClassName = inputBase;
