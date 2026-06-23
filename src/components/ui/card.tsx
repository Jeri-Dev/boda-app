import * as React from "react";

import { cn } from "@/lib/utils/cn";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Card — a padded, warmly-shadowed surface.
 *
 * Composable: pair with `CardHeader`, `CardTitle`, `CardDescription`,
 * `CardContent`, and `CardFooter` for consistent internal rhythm.
 */
export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)]",
        "border border-[var(--color-border)]",
        "bg-[var(--color-card)] text-[var(--color-card-foreground)]",
        "shadow-[var(--shadow-warm)]",
        "overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: DivProps) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 px-6 pt-6 pb-4", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-display text-xl leading-tight tracking-tight text-[var(--color-foreground)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-[var(--color-muted-foreground)]", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: DivProps) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-6 py-4",
        "border-t border-[var(--color-border)]",
        "bg-[var(--color-muted)]/60",
        className,
      )}
      {...props}
    />
  );
}
