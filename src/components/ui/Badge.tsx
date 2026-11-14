import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "neutral"
  | "lime"
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  neutral:
    "border-slate-200 bg-soft text-slate-700",

  lime:
    "border-lime/40 bg-lime/25 text-midnight",

  success:
    "border-green-200 bg-green-50 text-success",

  warning:
    "border-amber-200 bg-amber-50 text-amber-800",

  danger:
    "border-red-200 bg-red-50 text-danger",

  info:
    "border-blue-200 bg-blue-50 text-info",
};

export function Badge({
  variant = "neutral",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border",
        "px-2 py-0.5 text-xs font-medium leading-4",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}