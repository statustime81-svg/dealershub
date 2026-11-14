import { useState } from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

import { EmptyState } from "@/components/shared/EmptyState";

import { useAuth } from "@/hooks/useAuth";

import {
  formatDateTime,
} from "@/lib/formatters";

import {
  getManagedInvitations,
  revokeManagedInvitation,
} from "../invitations-management.api";

export function InvitationsManager({
  businessId,
}: {
  businessId: string;
}) {
  const { user } = useAuth();

  const cache = useQueryClient();
  const [page, setPage] = useState(1);

  const key = [
    "user",
    user?.id,
    "business",
    businessId,
    "managed-invitations",
  ] as const;

  const invitations = useQuery({
    queryKey: [...key, page],

    queryFn: () =>
      getManagedInvitations(businessId, page),
  });

  const revoke = useMutation({
    mutationFn: (invitationId: string) =>
      revokeManagedInvitation(
        businessId,
        invitationId,
      ),

    onSuccess: async () => {
      await cache.invalidateQueries({
        queryKey: key,
      });
    },
  });

  const pages = Math.max(
    1,
    Math.ceil(
      (invitations.data?.total ?? 0) /
        (invitations.data?.pageSize ?? 15),
    ),
  );

  if (invitations.isPending) {
    return <Spinner label="Loading invitations" />;
  }

  if (invitations.isError) {
    return (
      <div>
        <p role="alert" className="text-sm text-danger">
          Invitations could not load.
        </p>

        <Button
          className="mt-3"
          variant="secondary"
          onClick={() => {
            void invitations.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted">
        Revoking an invitation prevents acceptance.
        It does not deactivate access already granted.
      </p>

      {revoke.isError && (
        <p role="alert" className="text-sm text-danger">
          Invitation could not be revoked. Refresh
          the list and check its current status.
        </p>
      )}

      {revoke.isSuccess && (
        <p role="status" className="text-sm text-success">
          Invitation status updated.
        </p>
      )}

      {!invitations.data.items.length ? (
        <EmptyState
          title="No invitations found"
          description="Invitations created by this business appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">
              Business invitations
            </caption>

            <thead className="bg-soft text-xs text-muted">
              <tr>
                {[
                  "Email",
                  "Role",
                  "Status",
                  "Created",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-3"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {invitations.data.items.map((item) => {
                const expired =
                  item.status === "pending" &&
                  new Date(item.expires_at).getTime() <=
                    Date.now();

                const status =
                  expired ? "expired" : item.status;

                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      {item.email}
                    </td>

                    <td className="px-4 py-3">
                      {item.target_role}
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          status === "accepted"
                            ? "success"
                            : status === "pending"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      {formatDateTime(
                        item.created_at,
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {status === "pending" ? (
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={revoke.isPending}
                          onClick={() => {
                            revoke.mutate(item.id);
                          }}
                        >
                          Revoke
                        </Button>
                      ) : (
                        <span className="text-muted">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {invitations.data.total} invitations
          {" · "}Page {page} of {pages}
        </p>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={
              page <= 1 ||
              invitations.isFetching ||
              revoke.isPending
            }
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>

          <Button
            size="sm"
            variant="secondary"
            disabled={
              page >= pages ||
              invitations.isFetching ||
              revoke.isPending
            }
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}