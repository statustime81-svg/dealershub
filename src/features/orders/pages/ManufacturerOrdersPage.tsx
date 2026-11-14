import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { useBusiness } from "@/hooks/useBusiness";
import { useDebounce } from "@/hooks/useDebounce";
import { useOrderList } from "../orders.hooks";
import { OrderFilters, type OrderFilterValues } from "../components/OrderFilters";
import { OrdersTable } from "../components/OrdersTable";
export function OrderListPanel({ mode, businessId }: { mode: "manufacturer" | "dealer"; businessId: string | null }) {
  const [filters, setFilters] = useState<OrderFilterValues>({ status: "all", search: "" });
  const debounced = useDebounce(filters); const key = JSON.stringify(debounced);
  const [pagination, setPagination] = useState({ key: "", page: 1 });
  const page = pagination.key === key ? pagination.page : 1;
  const orders = useOrderList({ scope: mode, businessId, ...debounced, page });
  const pages = Math.max(1, Math.ceil((orders.data?.total ?? 0) / (orders.data?.pageSize ?? 15)));
  function go(next: number) { setPagination({ key, page: Math.max(1, Math.min(pages, next)) }); }
  return <div className="space-y-4">
    <OrderFilters value={filters} onChange={setFilters} />
    {orders.isPending ? <Spinner label="Loading orders" /> : orders.isError ? <div>
      <p role="alert" className="text-sm text-danger">Orders could not load. Check your account access and connection.</p>
      <Button className="mt-3" variant="secondary" onClick={() => { void orders.refetch(); }}>Try again</Button>
    </div> : <>
      {orders.data.items.length ? <OrdersTable orders={orders.data.items} mode={mode} />
        : <EmptyState title="No orders found" description="Submitted orders appear here. Try changing the filters if needed." />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted" aria-live="polite">{orders.data.total} orders · Page {page} of {pages}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" disabled={page <= 1 || orders.isFetching} onClick={() => go(page - 1)}>Previous</Button>
          <Button size="sm" variant="secondary" disabled={page >= pages || orders.isFetching} onClick={() => go(page + 1)}>Next</Button>
        </div>
      </div>
    </>}
  </div>;
}
export default function ManufacturerOrdersPage() {
  const { activeBusinessId } = useBusiness();
  return <div className="space-y-6"><PageHeader title="Orders" description="Review and manage orders placed with your business." />
    {activeBusinessId ? <OrderListPanel key={activeBusinessId} mode="manufacturer" businessId={activeBusinessId} />
      : <EmptyState title="Select a business" />}
  </div>;
}
