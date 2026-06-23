import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Show a subtle required indicator after the label text. */
  required?: boolean;
}

export function Label({
  className,
  required,
  children,
  ...props
}: LabelProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-1",
        "text-sm font-medium text-[var(--color-foreground)]",
        "select-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span
          aria-hidden="true"
          className="text-[var(--color-accent)]"
          title="Requerido"
        >
          *
        </span>
      ) : null}
    </label>
  );
}
