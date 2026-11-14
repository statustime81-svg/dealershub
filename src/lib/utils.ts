import {
  clsx,
  type ClassValue,
} from "clsx";

import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getInitials(
  name: string | null | undefined,
): string {
  const words = name?.trim().split(/\s+/).filter(Boolean);

  if (!words?.length) {
    return "?";
  }

  const firstInitial = words[0]?.charAt(0) ?? "";

  const lastInitial =
    words.length > 1
      ? words[words.length - 1]?.charAt(0) ?? ""
      : "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
}

export function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

export function assertNever(value: never): never {
  throw new Error(
    `Unexpected application value: ${String(value)}`,
  );
}