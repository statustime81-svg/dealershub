import {
  useRef,
  useState,
} from "react";

import { useQuery } from "@tanstack/react-query";

import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

import { routes } from "@/config/routes";

import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";

import { BusinessProfileForm } from "../components/BusinessProfileForm";

import {
  getBusinessCategories,
  onboardBusiness,
} from "../businesses.api";

import type {
  BusinessOnboardingValues,
} from "../businesses.schemas";

export default function BusinessOnboardingPage() {
  const { user } = useAuth();

  const {
    memberships,
    isLoading,
    error,
    isPlatformAdmin,
    isDealer,
    refreshAccess,
  } = useBusiness();

  const [message, setMessage] =
    useState<string | null>(null);

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  const requestRef = useRef<{
    payload: string;
    key: string;
  } | null>(null);

  const categories = useQuery({
    queryKey: [
      "user",
      user?.id,
      "business-categories",
    ],

    queryFn: ({ signal }) =>
      getBusinessCategories(signal),

    enabled: Boolean(user),
  });

  async function handleCreate(
    values: BusinessOnboardingValues,
  ): Promise<void> {
    setSubmitError(null);

    const payload = JSON.stringify(values);

    if (requestRef.current?.payload !== payload) {
      requestRef.current = {
        payload,
        key: crypto.randomUUID(),
      };
    }

    try {
      await onboardBusiness(
        values,
        requestRef.current.key,
      );
    } catch {
      setSubmitError(
        "Unable to create the business. Check email verification, store URL availability and your connection. Retry without changing the form to reuse this request.",
      );
      return;
    }

    setMessage(
      "Business and private store created. Your store is unpublished until you finish setting it up.",
    );

    try {
      await refreshAccess();
    } catch {
      setSubmitError(
        "Business was created, but access could not refresh. Reload the page instead of submitting again.",
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-8">
        <Spinner label="Loading account access" />

        <span className="text-sm text-muted">
          Loading account access…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <section>
        <h2 className="text-xl font-bold">
          Unable to load your account
        </h2>

        <p className="mt-3 text-sm text-muted">
          Check your connection and database setup.
        </p>

        <Button
          className="mt-5"
          onClick={() => {
            void refreshAccess().catch(() => {
              // The query error state remains visible.
            });
          }}
        >
          Try again
        </Button>
      </section>
    );
  }

  const hasExistingAccess =
    memberships.length > 0 ||
    isPlatformAdmin ||
    isDealer;

  return (
    <section>
      <h2 className="text-2xl font-bold">
        {hasExistingAccess
          ? "Your account access"
          : "Set up your business"}
      </h2>

      <Link
        to={routes.auth.acceptInvitation}
        className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-info hover:underline"
      >
        View business invitations
      </Link>

      {message && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-green-50 p-3 text-sm leading-6 text-success"
        >
          {message}
        </p>
      )}

      {submitError && (
        <p
          role="alert"
          className="mt-4 text-sm leading-6 text-danger"
        >
          {submitError}
        </p>
      )}

      {hasExistingAccess ? (
        <div className="mt-4 space-y-3">
          {memberships.map((membership) => (
            <article
              key={membership.id}
              className="rounded-lg border border-border p-4"
            >
              <h3 className="text-sm font-semibold">
                {membership.business.company_name}
              </h3>

              <p className="mt-1 text-xs text-muted">
                {membership.role === "business_admin"
                  ? "Business administrator"
                  : "Salesperson"}
              </p>
            </article>
          ))}

          {isPlatformAdmin && (
            <p className="text-sm">
              Platform administrator account
            </p>
          )}

          {isDealer && (
            <p className="text-sm">
              Dealer profile available
            </p>
          )}

          <p className="text-xs leading-5 text-muted">
            Role-specific workspaces will be connected
            in the upcoming dashboard batches.
          </p>
        </div>
      ) : (
        <>
          {categories.isError && (
            <p
              role="alert"
              className="mt-4 text-sm text-danger"
            >
              Business categories could not load.
              Reload the page to try again.
            </p>
          )}

          <BusinessProfileForm
            key={user?.id}
            email={user?.email ?? ""}
            categories={categories.data ?? []}
            disabled={
              categories.isPending ||
              categories.isError ||
              Boolean(message)
            }
            onSubmit={handleCreate}
          />
        </>
      )}
    </section>
  );
}