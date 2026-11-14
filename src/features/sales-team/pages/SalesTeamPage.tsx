import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";

import { routes } from "@/config/routes";

import { useBusiness } from "@/hooks/useBusiness";
import { useDebounce } from "@/hooks/useDebounce";

import {
  SALES_TEAM_PAGE_SIZE,
} from "../sales-team.api";

import { useSalesTeam } from "../sales-team.hooks";

import { InviteSalespersonForm } from "../components/InviteSalespersonForm";
import { SalesTeamTable } from "../components/SalesTeamTable";

function BusinessSalesTeam({
  businessId,
}: {
  businessId: string;
}) {
  const [inviteOpen, setInviteOpen] =
    useState(false);

  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);

  const [pagination, setPagination] = useState({
    search: "",
    page: 1,
  });

  const page =
    pagination.search === debounced
      ? pagination.page
      : 1;

  const team = useSalesTeam(page, debounced);

  const pages = Math.max(
    1,
    Math.ceil(
      (team.data?.total ?? 0) /
        SALES_TEAM_PAGE_SIZE,
    ),
  );

  function go(next: number) {
    setPagination({
      search: debounced,
      page: Math.max(1, Math.min(pages, next)),
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => {
            setInviteOpen((current) => !current);
          }}
        >
          {inviteOpen
            ? "Close invitation form"
            : "+ Invite salesperson"}
        </Button>

        <Link
          to={routes.manufacturer.assignments}
          className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium"
        >
          Assign dealers
        </Link>

        <Link
          to={routes.manufacturer.invitations}
          className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium"
        >
          Manage invitations
        </Link>
      </div>

      {inviteOpen && (
        <InviteSalespersonForm
          businessId={businessId}
        />
      )}

      <SearchInput
        label="Search salespeople"
        placeholder="Search salesperson name…"
        maxLength={200}
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
        }}
      />

      {team.isPending ? (
        <Spinner label="Loading sales team" />
      ) : team.isError ? (
        <div>
          <p role="alert" className="text-sm text-danger">
            Sales team could not load.
          </p>

          <Button
            className="mt-3"
            variant="secondary"
            onClick={() => {
              void team.refetch();
            }}
          >
            Try again
          </Button>
        </div>
      ) : (
        <>
          {team.data.items.length ? (
            <SalesTeamTable
              salespeople={team.data.items}
            />
          ) : (
            <EmptyState
              title="No salespeople found"
              description="Accepted invitations appear here."
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {team.data.total} salespeople
              {" · "}Page {page} of {pages}
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={
                  page <= 1 || team.isFetching
                }
                onClick={() => go(page - 1)}
              >
                Previous
              </Button>

              <Button
                size="sm"
                variant="secondary"
                disabled={
                  page >= pages || team.isFetching
                }
                onClick={() => go(page + 1)}
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

export default function SalesTeamPage() {
  const { activeBusinessId } = useBusiness();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales team"
        description="Manage salespeople and dealer assignments."
      />

      {activeBusinessId ? (
        <BusinessSalesTeam
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