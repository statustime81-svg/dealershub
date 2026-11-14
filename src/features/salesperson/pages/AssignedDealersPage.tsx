import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { useBusiness } from "@/hooks/useBusiness";
import { useDebounce } from "@/hooks/useDebounce";
import { useAssignedDealers } from "../salesperson.hooks";
import { AssignedDealerCard } from "../components/AssignedDealerCard";
function DealerDirectory({ businessId }: { businessId: string }) {
  const [search, setSearch] = useState(""); const debounced = useDebounce(search);
  const [pagination, setPagination] = useState({ search: "", page: 1 });
  const page = pagination.search === debounced ? pagination.page : 1;
  const dealers = useAssignedDealers(businessId, debounced, page);
  const pages = Math.max(1, Math.ceil((dealers.data?.total ?? 0) / (dealers.data?.pageSize ?? 15)));
  function go(next: number) { setPagination({ search: debounced, page: Math.max(1, Math.min(pages, next)) }); }
  return <div className="space-y-5">
    <SearchInput label="Search assigned dealers" placeholder="Search dealer company or phone…" maxLength={200} value={search} onChange={(event) => setSearch(event.target.value)} />
    {dealers.isPending ? <Spinner label="Loading assigned dealers" /> : dealers.isError ? <div>
      <p role="alert" className="text-sm text-danger">Assigned dealers could not load. Check your business membership and connection.</p>
      <Button className="mt-3" variant="secondary" onClick={() => { void dealers.refetch(); }}>Try again</Button>
    </div> : <>
      {dealers.data.items.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{dealers.data.items.map((dealer) =>
        <AssignedDealerCard key={dealer.dealerId} dealer={dealer} businessId={businessId} />)}</div>
      : <EmptyState title="No dealers available" description="Ask your manufacturer to assign dealers with active access to a published store." />}
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted" aria-live="polite">{dealers.data.total} dealers · Page {page} of {pages}</p>
        <div className="flex gap-2"><Button size="sm" variant="secondary" disabled={page <= 1 || dealers.isFetching} onClick={() => go(page - 1)}>Previous</Button>
          <Button size="sm" variant="secondary" disabled={page >= pages || dealers.isFetching} onClick={() => go(page + 1)}>Next</Button></div>
      </div>
    </>}
  </div>;
}
export default function AssignedDealersPage() {
  const { activeBusinessId } = useBusiness();
  return <div className="space-y-6"><PageHeader title="Assigned dealers" description="Choose a dealer to browse its authorized catalog and create an order on its behalf." />
    {activeBusinessId && <DealerDirectory key={activeBusinessId} businessId={activeBusinessId} />}
  </div>;
}
