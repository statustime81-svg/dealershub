import {
  forwardRef,
  useId,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(function Textarea(
  {
    id,
    label,
    hint,
    error,
    className,
    containerClassName,
    required,
    rows = 4,
    "aria-describedby": describedBy,
    "aria-invalid": ariaInvalid,
    ...props
  },
  ref,
) {
  const generatedId = useId();

  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const descriptionIds = [
    describedBy,
    hint ? hintId : undefined,
    error ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium"
        >
          {label}

          {required && (
            <span
              aria-hidden="true"
              className="ml-1 text-danger"
            >
              *
            </span>
          )}
        </label>
      )}

      <textarea
        {...props}
        ref={ref}
        id={inputId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={descriptionIds}
        className={cn(
          "app-transition min-h-28 w-full resize-y rounded-lg border",
          "bg-surface px-3 py-2.5 text-sm leading-6",
          "text-foreground placeholder:text-muted",
          "disabled:cursor-not-allowed disabled:bg-soft disabled:opacity-60",
          error ? "border-danger" : "border-border",
          className,
        )}
      />

      {hint && (
        <p
          id={hintId}
          className="text-xs leading-5 text-muted"
        >
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          className="text-xs leading-5 text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
});