import { useState } from "react";

import {
  LogOut,
  Menu,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";

import { routes } from "@/config/routes";

import { signOut } from "@/features/auth/auth.api";

import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";

import { getInitials } from "@/lib/utils";

interface AppHeaderProps {
  onOpenNavigation: () => void;
}

export function AppHeader({
  onOpenNavigation,
}: AppHeaderProps) {
  const navigate = useNavigate();

  const { user } = useAuth();
  const { activeMembership } = useBusiness();

  const [isSigningOut, setIsSigningOut] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleSignOut() {
    setIsSigningOut(true);
    setError(null);

    try {
      await signOut();

      navigate(routes.auth.login, {
        replace: true,
      });
    } catch {
      setError(
        "Unable to sign out. Please try again.",
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="flex min-h-17 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={onOpenNavigation}
          >
            <Menu
              size={20}
              aria-hidden="true"
            />
          </Button>

          <p className="truncate text-sm font-semibold">
            {activeMembership?.business.company_name}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div
            aria-hidden="true"
            className="hidden size-9 items-center justify-center rounded-full bg-midnight text-xs font-semibold text-white sm:flex"
          >
            {getInitials(user?.email)}
          </div>

          <div className="hidden max-w-48 sm:block">
            <p className="truncate text-xs font-medium">
              {user?.email}
            </p>

            <p className="mt-0.5 text-xs text-muted">
              Business administrator
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void handleSignOut();
            }}
            isLoading={isSigningOut}
            loadingText="Signing out…"
          >
            {!isSigningOut && (
              <LogOut
                size={16}
                aria-hidden="true"
              />
            )}

            Sign out
          </Button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="px-4 pb-3 text-xs text-danger sm:px-6"
        >
          {error}
        </p>
      )}
    </header>
  );
}