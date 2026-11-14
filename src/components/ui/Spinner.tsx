import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({
  className,
  label = "Loading",
}: SpinnerProps) {
  return (
    <span
      role="status"
      className="inline-flex items-center justify-center"
    >
      <LoaderCircle
        aria-hidden="true"
        className={cn(
          "size-4 animate-spin",
          className,
        )}
      />

      <span className="sr-only">
        {label}
      </span>
    </span>
  );
}