import { Link } from "react-router-dom";

import {
  Building2,
  Users,
  ShoppingCart,
  PackageCheck,
  UserRoundCheck,
  BadgeCheck,
  ShieldAlert,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

import { routes } from "@/config/routes";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import type { PlatformOverview } from "../super-admin.schemas";

interface Metric {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
}

export function PlatformMetrics({
  overview,
}: {
  overview: PlatformOverview;
}) {
  const metrics: Metric[] = [
    {
      label: "Registered businesses",
      value: overview.businesses,
      icon: Building2,
      href: routes.admin.businesses,
    },
    {
      label: "Registered users",
      value: overview.users,
      icon: Users,
      href: routes.admin.users,
    },
    {
      label: "Dealer identities",
      value: overview.dealers,
      icon: PackageCheck,
      href: `${routes.admin.users}?role=dealer`,
    },
    {
      label: "Active salespeople",
      value: overview.activeSalespeople,
      icon: UserRoundCheck,
      href: `${routes.admin.users}?role=salesperson`,
    },
    {
      label: "Total orders",
      value: overview.orders,
      icon: ShoppingCart,
      href: routes.admin.reports,
    },
    {
      label: "Verified businesses",
      value: overview.verifiedBusinesses,
      icon: BadgeCheck,
      href: `${routes.admin.businesses}?verification=verified`,
    },
    {
      label: "Active businesses",
      value: overview.activeBusinesses,
      icon: Building2,
      href: `${routes.admin.businesses}?status=active`,
    },
    {
      label: "Suspended businesses",
      value: overview.suspendedBusinesses,
      icon: ShieldAlert,
      href: `${routes.admin.businesses}?status=suspended`,
    },
  ];

  return (
    <div className="space-y-4">
      <section
        aria-label="Platform metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            to={href}
            className="group block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-lime-hover hover:bg-soft"
          >
            <div className="flex items-center gap-3">
              <Icon size={19} aria-hidden="true" />

              <h2 className="text-xs font-medium text-muted">
                {label}
              </h2>

              <ArrowUpRight
                size={16}
                className="ml-auto shrink-0 text-muted transition-colors group-hover:text-foreground"
                aria-hidden="true"
              />
            </div>

            <p className="mt-4 font-mono text-2xl font-semibold">
              {formatNumber(value)}
            </p>

            <span className="mt-2 block text-xs text-muted">
              View details
            </span>
          </Link>
        ))}
      </section>

      <Link
        to={routes.admin.reports}
        className="group block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-lime-hover hover:bg-soft"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-muted">
            Submitted order value
          </h2>

          <ArrowUpRight
            size={17}
            aria-hidden="true"
            className="text-muted group-hover:text-foreground"
          />
        </div>

        <p className="mt-3 font-mono text-2xl font-semibold">
          {formatCurrency(overview.submittedOrderValue)}
        </p>

        <p className="mt-2 text-xs leading-5 text-muted">
          Includes submitted orders across all statuses.
          This is not collected payment or platform revenue.
        </p>

        <span className="mt-3 inline-block text-xs font-medium">
          View order reports →
        </span>
      </Link>
    </div>
  );
}