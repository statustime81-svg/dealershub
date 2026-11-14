import { Button } from "@/components/ui/Button";

import { useDealerAccessMutation } from "../dealers.hooks";

import type {
  DealerAccessRow,
} from "../dealers.api";

export function DealerAccessControls({
  access,
}: {
  access: DealerAccessRow;
}) {
  const mutation = useDealerAccessMutation();

  function update(
    status: "active" | "rejected" | "inactive",
  ) {
    mutation.mutate({
      businessId: access.business_id,
      storeId: access.store_id,
      dealerId: access.dealer_id,
      status,
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {access.status === "pending" ? (
          <>
            <Button
              size="sm"
              disabled={mutation.isPending}
              onClick={() => update("active")}
            >
              Approve
            </Button>

            <Button
              size="sm"
              variant="danger"
              disabled={mutation.isPending}
              onClick={() => update("rejected")}
            >
              Reject
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            isLoading={mutation.isPending}
            loadingText="Updating…"
            onClick={() => {
              update(
                access.status === "active"
                  ? "inactive"
                  : "active",
              );
            }}
          >
            {access.status === "active"
              ? "Deactivate"
              : "Activate"}
          </Button>
        )}
      </div>

      {mutation.isError && (
        <p
          role="alert"
          className="text-xs text-danger"
        >
          Access could not be updated.
        </p>
      )}
    </div>
  );
}