"use client";

import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface DialogHandle {
  open: () => void;
  close: () => void;
}

export interface DialogProps
  extends Omit<React.DialogHTMLAttributes<HTMLDialogElement>, "onClose"> {
  /** Controlled open state (optional — pair with `onOpenChange`). */
  open?: boolean;
  /** Called whenever the dialog opens or closes (Escape, backdrop, programmatic). */
  onOpenChange?: (open: boolean) => void;
  /** Clicking the backdrop closes the dialog. Defaults to true. */
  closeOnBackdropClick?: boolean;
  /** Width of the dialog surface. */
  size?: "sm" | "md" | "lg";
  /** Forward a handle for imperative open/close from a parent. */
  handleRef?: React.Ref<DialogHandle>;
  children?: React.ReactNode;
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
} as const;

/**
 * Dialog wraps the native HTML `<dialog>` element.
 *
 * Why native: keyboard focus is trapped by the platform, Escape closes for
 * free, the top-layer renders above any z-index, and there are no extra
 * runtime deps. Backdrop click + controlled `open` are added on top.
 */
export function Dialog({
  open,
  onOpenChange,
  closeOnBackdropClick = true,
  size = "md",
  handleRef,
  className,
  children,
  ...props
}: DialogProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  // Expose imperative open/close to parents.
  React.useImperativeHandle(
    handleRef,
    () => ({
      open: () => dialogRef.current?.showModal(),
      close: () => dialogRef.current?.close(),
    }),
    [],
  );

  // Sync controlled `open` prop to the native dialog.
  React.useEffect(() => {
    const node = dialogRef.current;
    if (!node || open === undefined) return;
    if (open && !node.open) {
      node.showModal();
    } else if (!open && node.open) {
      node.close();
    }
  }, [open]);

  // Notify the parent on any close event (Escape, .close(), form method=dialog).
  const handleClose = React.useCallback(() => {
    onOpenChange?.(false);
  }, [onOpenChange]);

  // Backdrop click handler: native <dialog> reports the dialog itself as the
  // target when the user clicks outside the rendered content box.
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (!closeOnBackdropClick) return;
      if (event.target === dialogRef.current) {
        dialogRef.current?.close();
      }
    },
    [closeOnBackdropClick],
  );

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onClick={handleClick}
      className={cn(
        // Reset the UA dialog styling — we want our own surface.
        "p-0 m-auto",
        "bg-transparent text-[var(--color-foreground)]",
        "open:animate-in",
        className,
      )}
      {...props}
    >
      {/*
        Inner wrapper holds the visual surface so the outer <dialog>
        can act purely as the backdrop click target.
      */}
      <div
        className={cn(
          "w-[calc(100vw-2rem)]",
          sizes[size],
          "rounded-[var(--radius-lg)]",
          "bg-[var(--color-card)] text-[var(--color-card-foreground)]",
          "border border-[var(--color-border)]",
          "shadow-[var(--shadow-warm)]",
        )}
        // Stop clicks inside the surface from bubbling to the backdrop handler.
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </dialog>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 px-6 pt-6 pb-2", className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "font-display text-xl leading-tight tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function DialogDescription({
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

export function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-4", className)} {...props} />;
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 px-6 pb-6 pt-2",
        className,
      )}
      {...props}
    />
  );
}
