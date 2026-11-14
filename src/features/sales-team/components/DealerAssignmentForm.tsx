import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";

import { useBusiness } from "@/hooks/useBusiness";

import {
  useAssignmentMutation,
  useAssignmentOptions,
} from "../assignments.hooks";

export function DealerAssignmentForm({
  salespersonId,
}: {
  salespersonId?: string;
}) {
  const { activeBusinessId } = useBusiness();

  const options = useAssignmentOptions();
  const mutation = useAssignmentMutation();

  const [selectedPerson, setSelectedPerson] =
    useState(salespersonId ?? "");

  const [dealerId, setDealerId] = useState("");

  const effectivePersonId =
    salespersonId ?? selectedPerson;

  if (options.isPending) {
    return <Spinner label="Loading assignment options" />;
  }

  if (options.isError) {
    return (
      <div>
        <p role="alert" className="text-sm text-danger">
          Assignment options could not load.
        </p>

        <Button
          className="mt-3"
          variant="secondary"
          onClick={() => {
            void options.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  const validPerson = options.data.salespeople.some(
    (person) =>
      person.userId === effectivePersonId,
  );

  const validDealer = options.data.dealers.some(
    (dealer) => dealer.userId === dealerId,
  );

  return (
    <form
      className="space-y-4 rounded-xl border border-border bg-surface p-5"
      onSubmit={(event) => {
        event.preventDefault();

        if (
          !activeBusinessId ||
          !validPerson ||
          !validDealer
        ) {
          return;
        }

        mutation.mutate({
          businessId: activeBusinessId,
          salespersonId: effectivePersonId,
          dealerId,
          active: true,
        });
      }}
    >
      <h2 className="text-lg font-semibold">
        Assign dealer
      </h2>

      <Select
        label="Salesperson"
        value={effectivePersonId}
        disabled={
          Boolean(salespersonId) ||
          mutation.isPending
        }
        onChange={(event) => {
          setSelectedPerson(event.target.value);
          mutation.reset();
        }}
      >
        <option value="">Select salesperson</option>

        {options.data.salespeople.map((person) => (
          <option
            key={person.userId}
            value={person.userId}
          >
            {person.name || "Name not provided"}
          </option>
        ))}
      </Select>

      <Select
        label="Dealer"
        value={dealerId}
        disabled={mutation.isPending}
        onChange={(event) => {
          setDealerId(event.target.value);
          mutation.reset();
        }}
      >
        <option value="">Select dealer</option>

        {options.data.dealers.map((dealer) => (
          <option
            key={dealer.userId}
            value={dealer.userId}
          >
            {dealer.companyName}
          </option>
        ))}
      </Select>

      <p className="text-xs leading-5 text-muted">
        Only active salesperson memberships and
        dealers with active business access are
        available.
      </p>

      {mutation.isError && (
        <p role="alert" className="text-sm text-danger">
          Assignment could not be saved. Refresh
          the options and check account access.
        </p>
      )}

      {mutation.isSuccess && (
        <p role="status" className="text-sm text-success">
          Dealer assigned.
        </p>
      )}

      <Button
        type="submit"
        disabled={!validPerson || !validDealer}
        isLoading={mutation.isPending}
        loadingText="Assigning…"
      >
        Assign dealer
      </Button>
    </form>
  );
}