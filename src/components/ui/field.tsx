"use client";

import * as React from "react";

import { Label } from "./label";
import { cn } from "@/lib/utils/cn";

export interface FieldProps {
  /** Label text rendered above the input. */
  label: React.ReactNode;
  /** Optional helper text shown under the input when there is no error. */
  hint?: React.ReactNode;
  /** Error message — when present, the input is flagged invalid. */
  error?: React.ReactNode;
  /** Marks the field as required (adds a visual indicator + `required` attr). */
  required?: boolean;
  /** Optional explicit id; otherwise one is generated. */
  id?: string;
  /** Extra classes on the outer wrapper. */
  className?: string;
  /** A single form control (Input / Textarea / Select / ...). */
  children: React.ReactElement;
}

/**
 * Field composes Label + an input slot + optional hint/error text.
 *
 * It auto-wires the relationship between the label and the input by cloning
 * `children` and injecting `id`, `aria-invalid`, `aria-describedby` and (when
 * relevant) `required`. Keeps form markup accessible without piping ids by
 * hand.
 *
 *   <Field label="Nombre" error={errors?.name?.[0]}>
 *     <Input name="name" />
 *   </Field>
 */
export function Field({
  label,
  hint,
  error,
  required,
  id,
  className,
  children,
}: FieldProps) {
  const reactId = React.useId();
  const fieldId = id ?? `field-${reactId}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  const child = React.Children.only(children) as React.ReactElement<
    Record<string, unknown>
  >;

  // Merge any aria-describedby the child already had with our hint/error ids.
  const childProps = child.props;
  const existingDescribedBy =
    typeof childProps["aria-describedby"] === "string"
      ? (childProps["aria-describedby"] as string)
      : undefined;
  const describedBy =
    [existingDescribedBy, hintId, errorId].filter(Boolean).join(" ") ||
    undefined;

  const control = React.cloneElement(child, {
    id: (childProps.id as string | undefined) ?? fieldId,
    "aria-invalid":
      childProps["aria-invalid"] !== undefined
        ? childProps["aria-invalid"]
        : error
          ? true
          : undefined,
    "aria-describedby": describedBy,
    required:
      childProps.required !== undefined ? childProps.required : required,
  });

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      {control}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-[var(--color-destructive)]"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-[var(--color-muted-foreground)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
