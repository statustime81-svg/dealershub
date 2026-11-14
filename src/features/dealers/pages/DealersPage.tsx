import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";

import { useBusiness } from "@/hooks/useBusiness";
import { useDebounce } from "@/hooks/useDebounce";

import { useCatalogStores } from "@/features/catalog/catalog.hooks";

import {
  DEALER_PAGE_SIZE,
  type DealerListInput,
} from "../dealers.api";

import { useDealers } from "../dealers.hooks";

import { DealersTable } from "../components/DealersTable";
import { InviteDealerForm } from "../components/InviteDealerForm";

function StoreDealers({
  businessId,
  storeId,
}: {
  businessId: string;
  storeId: string;
}) {
  const [inviteOpen, setInviteOpen] =
    useState(false);

  const [filters, setFilters] = useState<{
    search: string;
    status: DealerListInput["status"];
  }>({
    search: "",
    status: "all",
  });

  const debounced = useDebounce(filters);

  const filterKey = JSON.stringify(debounced);

  const [pagination, setPagination] = useState({
    key: "",
    page: 1,
  });

  const page =
    pagination.key === filterKey
      ? pagination.page
      : 1;

  const dealers = useDealers({
    businessId,
    storeId,
    ...debounced,
    page,
  });

  const pages = Math.max(
    1,
    Math.ceil(
      (dealers.data?.total ?? 0) /
        DEALER_PAGE_SIZE,
    ),
  );

  function changePage(next: number) {
    setPagination({
      key: filterKey,
      page: Math.max(
        1,
        Math.min(pages, next),
      ),
    });
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={() => {
          setInviteOpen((current) => !current);
        }}
      >
        {inviteOpen
          ? "Close invitation form"
          : "+ Invite dealer"}
      </Button>

      {inviteOpen && (
        <InviteDealerForm
          businessId={businessId}
          storeId={storeId}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <SearchInput
          label="Search dealers"
          placeholder="Search dealer company…"
          maxLength={200}
          value={filters.search}
          onChange={(event) => {
            setFilters((current) => ({
              ...current,
              search: event.target.value,
            }));
          }}
        />

        <Select
          aria-label="Dealer access status"
          value={filters.status}
          onChange={(event) => {
            const status = event.target.value;

            if (
              status === "all" ||
              status === "active" ||
              status === "pending" ||
              status === "inactive" ||
              status === "rejected"
            ) {
              setFilters((current) => ({
                ...current,
                status,
              }));
            }
          }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {dealers.isPending ? (
        <Spinner label="Loading dealers" />
      ) : dealers.isError ? (
        <div>
          <p role="alert" className="text-sm text-danger">
            Dealers could not load.
          </p>

          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => {
              void dealers.refetch();
            }}
          >
            Try again
          </Button>
        </div>
      ) : (
        <>
          {dealers.data.items.length ? (
            <DealersTable
              dealers={dealers.data.items}
            />
          ) : (
            <EmptyState
              title="No dealers found"
              description="Accepted invitations and existing access requests appear here."
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {dealers.data.total} dealers
              {" · "}Page {page} of {pages}
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={
                  page <= 1 || dealers.isFetching
                }
                onClick={() => changePage(page - 1)}
              >
                Previous
              </Button>

              <Button
                size="sm"
                variant="secondary"
                disabled={
                  page >= pages ||
                  dealers.isFetching
                }
                onClick={() => changePage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function DealersPage() {
  const { activeBusinessId } = useBusiness();

  const stores = useCatalogStores();

  const [selectedId, setSelectedId] =
    useState("");

  const store =
    stores.data?.find(
      (item) => item.id === selectedId,
    ) ??
    stores.data?.[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dealers"
        description="Manage your authorized dealer network."
      />

      {stores.isPending ? (
        <Spinner label="Loading stores" />
      ) : stores.isError ? (
        <div>
          <p role="alert" className="text-sm text-danger">
            Stores could not load.
          </p>

          <Button
            className="mt-3"
            variant="secondary"
            onClick={() => {
              void stores.refetch();
            }}
          >
            Try again
          </Button>
        </div>
      ) : !store || !activeBusinessId ? (
        <EmptyState
          title="No store available"
          description="Complete business setup first."
        />
      ) : (
        <>
          <Select
            label="Store"
            containerClassName="max-w-sm"
            value={store.id}
            onChange={(event) => {
              setSelectedId(event.target.value);
            }}
          >
            {stores.data.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>

          <StoreDealers
            key={`${activeBusinessId}:${store.id}`}
            businessId={activeBusinessId}
            storeId={store.id}
          />
        </>
      )}
    </div>
  );
}