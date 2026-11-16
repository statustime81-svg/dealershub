import { AdminPasswordResetForm } from "@/features/auth/components/AdminPasswordResetForm";
import { Link, useParams } from "react-router-dom";

import { z } from "zod";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

import { routeBuilders } from "@/config/routes";

import { useBusiness } from "@/hooks/useBusiness";

import {
  formatDate,
  formatNumber,
} from "@/lib/formatters";

import {
  useAssignmentMutation,
  useSalespersonWorkspace,
} from "../assignments.hooks";

import { DealerAssignmentForm } from "../components/DealerAssignmentForm";

function SalespersonDetails({
  salespersonId,
}: {
  salespersonId: string;
}) {
  const { activeBusinessId } = useBusiness();

  const workspace = useSalespersonWorkspace(
    salespersonId,
  );

  const mutation = useAssignmentMutation();

  if (workspace.isPending) {
    return <Spinner label="Loading salesperson" />;
  }

  if (workspace.isError) {
    return (
      <div>
        <p role="alert" className="text-sm text-danger">
          Salesperson details could not load.
        </p>

        <Button
          className="mt-3"
          variant="secondary"
          onClick={() => {
            void workspace.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  const { person, assignments, orderCount } =
    workspace.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={person.name || "Salesperson"}
        description="Membership and dealer assignments."
      />

      {activeBusinessId&&<AdminPasswordResetForm key={salespersonId} userId={salespersonId} businessId={activeBusinessId} label={person.name || "Salesperson"}/>}
      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted">Phone</p>
          <p className="mt-2 text-sm">
            {person.phone ?? "—"}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted">
            Joined
          </p>
          <p className="mt-2 text-sm">
            {formatDate(person.createdAt)}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted">
            Orders created for this business
          </p>
          <p className="mt-2 font-mono text-xl font-semibold">
            {formatNumber(orderCount)}
          </p>
        </div>

        <Badge
          variant={
            person.status === "active"
              ? "success"
              : "neutral"
          }
        >
          {person.status}
        </Badge>
      </section>

      {person.status === "active" && (
        <DealerAssignmentForm
          key={person.userId}
          salespersonId={person.userId}
        />
      )}

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">
          Dealer assignments
        </h2>

        {mutation.isError && (
          <p
            role="alert"
            className="mt-3 text-sm text-danger"
          >
            Assignment could not be updated.
            Check dealer and salesperson access.
          </p>
        )}

        {mutation.isSuccess && (
          <p
            role="status"
            className="mt-3 text-sm text-success"
          >
            Assignment updated.
          </p>
        )}

        <div className="mt-4 space-y-3">
          {assignments.map((assignment) => (
            <article
              key={assignment.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4"
            >
              <div>
                <Link
                  to={routeBuilders.manufacturerDealer(
                    assignment.dealerId,
                  )}
                  className="text-sm font-medium hover:underline"
                >
                  {assignment.companyName}
                </Link>

                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge
                    variant={
                      assignment.isActive
                        ? "success"
                        : "neutral"
                    }
                  >
                    {assignment.isActive
                      ? "Assigned"
                      : "Inactive assignment"}
                  </Badge>

                  {!assignment.hasStoreAccess && (
                    <Badge variant="warning">
                      No active store access
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                variant="secondary"
                disabled={
                  mutation.isPending ||
                  (
                    !assignment.isActive &&
                    (
                      person.status !== "active" ||
                      !assignment.hasStoreAccess
                    )
                  )
                }
                onClick={() => {
                  if (!activeBusinessId) return;

                  mutation.mutate({
                    businessId: activeBusinessId,
                    salespersonId,
                    dealerId: assignment.dealerId,
                    active: !assignment.isActive,
                  });
                }}
              >
                {assignment.isActive
                  ? "Unassign"
                  : "Reactivate"}
              </Button>
            </article>
          ))}

          {!assignments.length && (
            <p className="text-sm text-muted">
              No dealer assignments yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default function SalespersonDetailsPage() {
  const { salespersonId } = useParams();

  const result = z.string().uuid().safeParse(
    salespersonId,
  );

  const { activeBusinessId } = useBusiness();

  if (!result.success) {
    return (
      <EmptyState
        title="Invalid salesperson"
        description="Open a person from the sales team list."
      />
    );
  }

  return (
    <SalespersonDetails
      key={`${activeBusinessId}:${result.data}`}
      salespersonId={result.data}
    />
  );
}