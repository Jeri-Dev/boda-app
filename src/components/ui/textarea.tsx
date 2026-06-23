import * as React from "react";

import { cn } from "@/lib/utils/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const textareaBase = [
  "flex w-full min-h-[7rem]",
  "rounded-[var(--radius)]",
  "border border-[var(--color-input)]",
  "bg-[var(--color-card)]",
  "px-3.5 py-2.5",
  "text-[0.9375rem] text-[var(--color-foreground)] leading-relaxed",
  "placeholder:text-[var(--color-muted-foreground)]",
  "shadow-[var(--shadow-soft)]",
  "transition-[border-color,box-shadow,background-color] duration-150",
  "hover:border-[var(--color-stone-400)]",
  "focus-visible:outline-none",
  "focus-visible:border-[var(--color-ring)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-0",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "aria-invalid:border-[var(--color-destructive)]",
  "aria-invalid:focus-visible:ring-[var(--color-destructive)]",
  "resize-y",
].join(" ");

export function Textarea({ className, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea rows={rows} className={cn(textareaBase, className)} {...props} />
  );
}
