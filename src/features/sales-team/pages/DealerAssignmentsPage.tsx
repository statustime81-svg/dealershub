import { Link } from "react-router-dom";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

import { routes } from "@/config/routes";

import { useBusiness } from "@/hooks/useBusiness";

import { DealerAssignmentForm } from "../components/DealerAssignmentForm";

export default function DealerAssignmentsPage() {
  const { activeBusinessId } = useBusiness();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dealer assignments"
        description="Connect dealers to your salespeople."
        actions={
          <Link
            to={routes.manufacturer.salesTeam}
            className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium"
          >
            View sales team
          </Link>
        }
      />

      {activeBusinessId ? (
        <div className="max-w-2xl">
          <DealerAssignmentForm
            key={activeBusinessId}
          />
        </div>
      ) : (
        <EmptyState
          title="Select a business"
          description="A business workspace is required."
        />
      )}
    </div>
  );
}