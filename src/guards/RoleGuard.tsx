import type { ReactNode } from "react";

import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { Spinner } from "@/components/ui/Spinner";

import { routes } from "@/config/routes";

import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";

import type { AppRole } from "@/types/auth";

interface RoleGuardProps {
  allowedRoles: readonly AppRole[];
  children?: ReactNode;
}

export function RoleGuard({
  allowedRoles,
  children,
}: RoleGuardProps) {
  const { user, isLoading: authLoading } = useAuth();

  const {
    activeMembership,
    isPlatformAdmin,
    isDealer,
    isLoading,
    error,
    refreshAccess,
  } = useBusiness();

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-3">
        <Spinner label="Checking account permissions" />

        <span className="text-sm text-muted">
          Checking permissions…
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={routes.auth.login}
        replace
      />
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-xl font-semibold">
          Unable to verify access
        </h1>

        <p
          role="alert"
          className="mt-3 text-sm text-muted"
        >
          Your account permissions could not load.
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

  const roles: AppRole[] = [];

  if (isPlatformAdmin) {
    roles.push("super_admin");
  }

  if (isDealer) {
    roles.push("dealer");
  }

  if (activeMembership) {
    roles.push(activeMembership.role);
  }

  const permitted = allowedRoles.some(
    (role) => roles.includes(role),
  );

  if (!permitted) {
    return (
      <Navigate
        to={routes.forbidden}
        replace
      />
    );
  }

  return children !== undefined
    ? <>{children}</>
    : <Outlet />;
}