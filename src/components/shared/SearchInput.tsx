import {
  forwardRef,
  type InputHTMLAttributes,
} from "react";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

interface SearchInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type"
  > {
  label: string;
  containerClassName?: string;
}

export const SearchInput = forwardRef<
  HTMLInputElement,
  SearchInputProps
>(function SearchInput(
  {
    label,
    className,
    containerClassName,
    ...props
  },
  ref,
) {
  return (
    <label
      className={cn(
        "relative block",
        containerClassName,
      )}
    >
      <span className="sr-only">
        {label}
      </span>

      <Search
        size={17}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
      />

      <input
        {...props}
        ref={ref}
        type="search"
        className={cn(
          "app-transition min-h-11 w-full rounded-lg",
          "border border-border bg-surface",
          "py-2 pl-10 pr-3 text-sm text-foreground",
          "placeholder:text-muted",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      />
    </label>
  );
});