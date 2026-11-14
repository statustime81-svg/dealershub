import {
  forwardRef,
  type ButtonHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger";

type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-lime text-midnight hover:bg-lime-hover",

  secondary:
    "border-border bg-surface text-foreground hover:bg-soft",

  ghost:
    "border-transparent bg-transparent text-foreground hover:bg-soft",

  danger:
    "border-red-200 bg-red-50 text-danger hover:bg-red-100",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3 text-xs",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-sm",
  icon: "size-11 shrink-0 p-0",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(function Button(
  {
    children,
    className,
    variant = "primary",
    size = "md",
    type = "button",
    disabled,
    isLoading = false,
    loadingText = "Please wait",
    ...props
  },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        "app-transition inline-flex items-center justify-center gap-2",
        "rounded-lg border font-semibold",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {isLoading ? (
        <>
          <Spinner label={loadingText} />

          {size !== "icon" && (
            <span>{loadingText}</span>
          )}
        </>
      ) : (
        children
      )}
    </button>
  );
});