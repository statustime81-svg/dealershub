import type { ReactNode } from "react";

import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { Spinner } from "@/components/ui/Spinner";

import { useAuth } from "@/hooks/useAuth";

interface GuestGuardProps {
  children?: ReactNode;

  authenticatedRedirectTo: string;
}

function isInternalPath(path: string): boolean {
  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\")
  );
}

export function GuestGuard({
  children,
  authenticatedRedirectTo,
}: GuestGuardProps) {
  const location = useLocation();

  const {
    user,
    isLoading,
  } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-3 bg-canvas">
        <Spinner label="Checking your session" />

        <span className="text-sm text-muted">
          Checking your session…
        </span>
      </div>
    );
  }

  const targetPathname =
    authenticatedRedirectTo.split(/[?#]/)[0];

  if (
    user &&
    isInternalPath(authenticatedRedirectTo) &&
    targetPathname !== location.pathname
  ) {
    return (
      <Navigate
        to={authenticatedRedirectTo}
        replace
      />
    );
  }

  return children !== undefined
    ? <>{children}</>
    : <Outlet />;
}