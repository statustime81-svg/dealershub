import { appConfig } from "@/config/app";

type NumericValue = number | null | undefined;

type DateValue =
  | string
  | number
  | Date
  | null
  | undefined;

function isValidNumber(
  value: NumericValue,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function parseDate(value: DateValue): Date | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const date =
    value instanceof Date
      ? new Date(value.getTime())
      : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatCurrency(
  value: NumericValue,
  fractionDigits = 2,
): string {
  if (!isValidNumber(value)) {
    return "—";
  }

  const digits = Math.min(
    6,
    Math.max(0, Math.trunc(fractionDigits)),
  );

  return new Intl.NumberFormat(appConfig.locale, {
    style: "currency",
    currency: appConfig.currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatNumber(
  value: NumericValue,
  maximumFractionDigits = 0,
): string {
  if (!isValidNumber(value)) {
    return "—";
  }

  const digits = Math.min(
    6,
    Math.max(0, Math.trunc(maximumFractionDigits)),
  );

  return new Intl.NumberFormat(appConfig.locale, {
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatDate(value: DateValue): string {
  const date = parseDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat(appConfig.locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(
  value: DateValue,
): string {
  const date = parseDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat(appConfig.locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatPercentage(
  value: NumericValue,
  fractionDigits = 1,
): string {
  if (!isValidNumber(value)) {
    return "—";
  }

  const digits = Math.min(
    6,
    Math.max(0, Math.trunc(fractionDigits)),
  );

  const formatted = new Intl.NumberFormat(
    appConfig.locale,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
      signDisplay: "exceptZero",
    },
  ).format(value);

  return `${formatted}%`;
}