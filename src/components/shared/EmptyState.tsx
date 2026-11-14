import type { ReactNode } from "react";

import { PackageOpen } from "lucide-react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-5 py-12 text-center",
        className,
      )}
    >
      <PackageOpen
        size={30}
        aria-hidden="true"
        className="text-muted"
      />

      <h2 className="mt-4 text-base font-semibold">
        {title}
      </h2>

      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  );
}