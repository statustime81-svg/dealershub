import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

import { useBusiness } from "@/hooks/useBusiness";

import { InvitationsManager } from "../components/InvitationsManager";

export default function BusinessInvitationsPage() {
  const { activeBusinessId } = useBusiness();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business invitations"
        description="Review dealer and salesperson invitations."
      />

      {activeBusinessId ? (
        <InvitationsManager
          key={activeBusinessId}
          businessId={activeBusinessId}
        />
      ) : (
        <EmptyState
          title="Select a business"
          description="A business workspace is required."
        />
      )}
    </div>
  );
}