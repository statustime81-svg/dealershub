import {
  useEffect,
  useState,
} from "react";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Link,
  useLocation,
} from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

import { routes } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";

import {
  acceptInvitation,
  getPendingInvitations,
} from "../invitations.api";

export default function AcceptInvitationPage() {
  const location = useLocation();
  const queryClient = useQueryClient();

  const {
    user,
    isLoading,
    isConfigured,
    error: sessionError,
  } = useAuth();

  const [companyName, setCompanyName] = useState("");
  const [busyId, setBusyId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const [actionError, setActionError] =
    useState<string | null>(null);

  useEffect(() => {
    setCompanyName("");
    setBusyId(null);
    setMessage(null);
    setActionError(null);
  }, [user?.id]);

  const query = new URLSearchParams(
    location.search,
  );

  const hash = new URLSearchParams(
    location.hash.replace(/^#/, ""),
  );

  const hasLinkError =
    query.has("error") ||
    query.has("error_code") ||
    hash.has("error") ||
    hash.has("error_code");

  const invitations = useQuery({
    queryKey: [
      "user",
      user?.id ?? null,
      "pending-invitations",
    ],

    queryFn: getPendingInvitations,

    enabled: Boolean(
      user &&
      isConfigured &&
      !hasLinkError &&
      !sessionError,
    ),
  });

  async function handleAccept(
    invitationId: string,
    role: "dealer" | "salesperson",
  ): Promise<void> {
    if (busyId) {
      return;
    }

    if (role === "dealer" && !companyName.trim()) {
      setActionError(
        "Enter your dealer company name.",
      );
      return;
    }

    setBusyId(invitationId);
    setActionError(null);
    setMessage(null);

    try {
      await acceptInvitation(
        invitationId,
        role === "dealer"
          ? companyName.trim()
          : undefined,
      );

      setMessage(
        "Invitation accepted. Your access has been updated.",
      );

      await queryClient.invalidateQueries({
        queryKey: ["user", user?.id],
      });
    } catch {
      setActionError(
        "Unable to accept this invitation. Check the company name and invitation status, then try again.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-8">
        <Spinner label="Checking invitation session" />

        <p className="text-sm text-muted">
          Checking your session…
        </p>
      </div>
    );
  }

  if (
    !user ||
    !isConfigured ||
    sessionError ||
    hasLinkError
  ) {
    return (
      <section>
        <h2 className="text-2xl font-bold">
          Open your invitation
        </h2>

        <p className="mt-3 text-sm leading-6 text-muted">
          Sign in with the email address that received
          the invitation. If the email link expired,
          ask your business administrator for a new one.
        </p>

        <Link
          to={routes.auth.login}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-info hover:underline"
        >
          Go to sign in
        </Link>
      </section>
    );
  }

  const hasDealerInvitation =
    invitations.data?.some(
      (invitation) =>
        invitation.role === "dealer",
    ) ?? false;

  return (
    <section aria-labelledby="invitation-heading">
      <h2
        id="invitation-heading"
        className="text-2xl font-bold tracking-tight"
      >
        Business invitations
      </h2>

      <p className="mt-2 break-all text-sm text-muted">
        Signed in as {user.email}
      </p>

      {invitations.isPending && (
        <div className="mt-6 flex items-center gap-3">
          <Spinner label="Loading invitations" />

          <span className="text-sm text-muted">
            Loading invitations…
          </span>
        </div>
      )}

      {invitations.isError && (
        <div className="mt-5 space-y-3">
          <p
            role="alert"
            className="text-sm text-danger"
          >
            Unable to load invitations.
          </p>

          <Button
            variant="secondary"
            onClick={() => {
              void invitations.refetch();
            }}
            isLoading={invitations.isFetching}
          >
            Try again
          </Button>
        </div>
      )}

      {message && (
        <p
          role="status"
          className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-success"
        >
          {message}
        </p>
      )}

      {actionError && (
        <p
          role="alert"
          className="mt-5 text-sm text-danger"
        >
          {actionError}
        </p>
      )}

      {hasDealerInvitation && (
        <div className="mt-5">
          <Input
            label="Dealer company name"
            value={companyName}
            onChange={(event) => {
              setCompanyName(event.target.value);
            }}
            maxLength={200}
            autoComplete="organization"
            disabled={busyId !== null}
            hint="Used when creating your dealer profile. An existing dealer profile will be preserved."
          />
        </div>
      )}

      <div className="mt-5 space-y-3">
        {invitations.data?.map((invitation) => (
          <article
            key={invitation.id}
            className="rounded-lg border border-border p-4"
          >
            <h3 className="text-sm font-semibold">
              {invitation.businessName}
            </h3>

            <p className="mt-1 text-xs text-muted">
              Role: {invitation.role}
            </p>

            <Button
              className="mt-4"
              disabled={busyId !== null}
              isLoading={busyId === invitation.id}
              loadingText="Accepting…"
              onClick={() => {
                void handleAccept(
                  invitation.id,
                  invitation.role,
                );
              }}
            >
              Accept invitation
            </Button>
          </article>
        ))}
      </div>

      {invitations.isSuccess &&
        invitations.data.length === 0 && (
          <p className="mt-5 text-sm leading-6 text-muted">
            No pending invitations were found for this
            account.
          </p>
        )}
    </section>
  );
}