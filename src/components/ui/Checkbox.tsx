import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type InputHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type"
  > {
  label?: string;
  hint?: string;
  error?: string;
  indeterminate?: boolean;
  containerClassName?: string;
}

export const Checkbox = forwardRef<
  HTMLInputElement,
  CheckboxProps
>(function Checkbox(
  {
    id,
    label,
    hint,
    error,
    indeterminate = false,
    className,
    containerClassName,
    disabled,
    required,
    "aria-describedby": describedBy,
    "aria-invalid": ariaInvalid,
    ...props
  },
  forwardedRef,
) {
  const generatedId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  useImperativeHandle(
    forwardedRef,
    () => inputRef.current!,
    [],
  );

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const descriptionIds = [
    describedBy,
    hint ? hintId : undefined,
    error ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={cn("space-y-1", containerClassName)}>
      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex min-h-11 items-center gap-2.5",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer",
        )}
      >
        <input
          {...props}
          ref={inputRef}
          id={inputId}
          type="checkbox"
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={descriptionIds}
          className={cn(
            "size-4 shrink-0 rounded border-border accent-lime",
            "disabled:cursor-not-allowed",
            className,
          )}
        />

        {label && (
          <span className="text-sm text-foreground">
            {label}

            {required && (
              <span
                aria-hidden="true"
                className="ml-1 text-danger"
              >
                *
              </span>
            )}
          </span>
        )}
      </label>

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