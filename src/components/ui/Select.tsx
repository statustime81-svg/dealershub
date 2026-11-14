import {
  forwardRef,
  useId,
  type SelectHTMLAttributes,
} from "react";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Select = forwardRef<
  HTMLSelectElement,
  SelectProps
>(function Select(
  {
    id,
    label,
    hint,
    error,
    children,
    className,
    containerClassName,
    required,
    multiple,
    size,
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

  const isList = multiple || (size !== undefined && size > 1);

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

      <div className="relative">
        <select
          {...props}
          ref={ref}
          id={inputId}
          required={required}
          multiple={multiple}
          size={size}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={descriptionIds}
          className={cn(
            "app-transition min-h-11 w-full rounded-lg border",
            "bg-surface px-3 py-2 text-sm text-foreground",
            "disabled:cursor-not-allowed disabled:bg-soft disabled:opacity-60",
            !isList && "appearance-none pr-10",
            error ? "border-danger" : "border-border",
            className,
          )}
        >
          {children}
        </select>

        {!isList && (
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          />
        )}
      </div>

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