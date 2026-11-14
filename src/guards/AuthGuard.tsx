import type { ReactNode } from "react";

import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { routes } from "@/config/routes";

import { useAuth } from "@/hooks/useAuth";

import { Spinner } from "@/components/ui/Spinner";

interface AuthGuardProps {
  children?: ReactNode;
}

export function AuthGuard({
  children,
}: AuthGuardProps) {
  const location = useLocation();

  const {
    user,
    isLoading,
    isConfigured,
    error,
  } = useAuth();

  if (!isConfigured) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-canvas p-6">
        <section className="w-full max-w-md rounded-xl border border-border bg-surface p-6">
          <h1 className="text-xl font-semibold">
            Connection setup required
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Configure the Supabase URL and publishable
            or anon key in .env.local, then restart
            the development server.
          </p>
        </section>
      </main>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-3 bg-canvas">
        <Spinner
          className="size-5"
          label="Checking your session"
        />

        <span className="text-sm text-muted">
          Checking your session…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-canvas p-6">
        <section
          role="alert"
          className="w-full max-w-md rounded-xl border border-border bg-surface p-6"
        >
          <h1 className="text-xl font-semibold">
            Unable to check your session
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Reload the page to try again. If this
            continues, check your connection and
            Supabase configuration.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 min-h-11 rounded-lg bg-lime px-4 text-sm font-semibold text-midnight"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={routes.auth.login}
        replace
        state={{
          from:
            location.pathname +
            location.search +
            location.hash,
        }}
      />
    );
  }

  return children !== undefined
    ? <>{children}</>
    : <Outlet />;
}