import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-lg bg-slate-200/70",
        className,
      )}
    />
  );
}

interface SkeletonGroupProps
  extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function SkeletonGroup({
  label = "Loading content",
  className,
  children,
  ...props
}: SkeletonGroupProps) {
  return (
    <div
      {...props}
      role="status"
      aria-busy="true"
      className={cn("space-y-3", className)}
    >
      <span className="sr-only">
        {label}
      </span>

      {children}
    </div>
  );
}