import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type DivProps = HTMLAttributes<HTMLDivElement>;

export function Card({
  className,
  ...props
}: DivProps) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-xl border border-border bg-surface",
        className,
      )}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: DivProps) {
  return (
    <div
      {...props}
      className={cn(
        "flex flex-col gap-1.5 p-4 sm:p-5",
        className,
      )}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      {...props}
      className={cn(
        "text-lg font-semibold leading-6 tracking-tight",
        className,
      )}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      {...props}
      className={cn(
        "text-sm leading-6 text-muted",
        className,
      )}
    />
  );
}

export function CardContent({
  className,
  ...props
}: DivProps) {
  return (
    <div
      {...props}
      className={cn(
        "p-4 pt-0 sm:p-5 sm:pt-0",
        className,
      )}
    />
  );
}

export function CardFooter({
  className,
  ...props
}: DivProps) {
  return (
    <div
      {...props}
      className={cn(
        "flex flex-wrap items-center gap-3",
        "border-t border-border p-4 sm:p-5",
        className,
      )}
    />
  );
}