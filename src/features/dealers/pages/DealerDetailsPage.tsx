import { AdminPasswordResetForm } from "@/features/auth/components/AdminPasswordResetForm";
import { useBusiness } from "@/hooks/useBusiness";
import { useParams } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

import { useDealerDetails } from "../dealers.hooks";

import { DealerProfilePanel } from "../components/DealerProfilePanel";

function DealerDetails({
  dealerId,
}: {
  dealerId: string;
}) {
  const {activeBusinessId}=useBusiness();
  const details = useDealerDetails(dealerId);

  if (details.isPending) {
    return <Spinner label="Loading dealer profile" />;
  }

  if (details.isError) {
    return (
      <div>
        <p role="alert" className="text-sm text-danger">
          Dealer profile could not load.
        </p>

        <Button
          className="mt-3"
          variant="secondary"
          onClick={() => {
            void details.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={details.data.dealer.company_name}
        description="Dealer profile and purchase activity."
      />

      <DealerProfilePanel details={details.data} />
      {activeBusinessId&&<AdminPasswordResetForm key={dealerId} userId={dealerId} businessId={activeBusinessId} label={details.data.dealer.company_name}/>}
    </div>
  );
}

export default function DealerDetailsPage() {
  const { dealerId } = useParams();

  const result = z.string().uuid().safeParse(
    dealerId,
  );

  if (!result.success) {
    return (
      <EmptyState
        title="Invalid dealer"
        description="Open a dealer from the dealer list."
      />
    );
  }

  return (
    <DealerDetails dealerId={result.data} />
  );
}