import type { ReactNode } from "react";

import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { Spinner } from "@/components/ui/Spinner";

import { routes } from "@/config/routes";

import { useBusiness } from "@/hooks/useBusiness";

interface BusinessGuardProps {
  children?: ReactNode;
}

export function BusinessGuard({
  children,
}: BusinessGuardProps) {
  const {
    activeMembership,
    isLoading,
    error,
    refreshAccess,
  } = useBusiness();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner label="Loading business" />
      </div>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-xl font-semibold">
          Business access unavailable
        </h1>

        <p
          role="alert"
          className="mt-3 text-sm text-muted"
        >
          Reload your business permissions to continue.
        </p>

        <button
          type="button"
          className="mt-5 min-h-11 rounded-lg bg-lime px-4 font-semibold"
          onClick={() => {
            void refreshAccess().catch(() => {
              // Query error remains visible.
            });
          }}
        >
          Try again
        </button>
      </main>
    );
  }

  if (!activeMembership) {
    return (
      <Navigate
        to={routes.onboarding}
        replace
      />
    );
  }

  return children !== undefined
    ? <>{children}</>
    : <Outlet />;
}