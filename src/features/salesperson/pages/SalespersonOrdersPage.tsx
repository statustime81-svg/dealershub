import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { OrderStatusBadge } from "@/components/commerce/OrderStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { useBusiness } from "@/hooks/useBusiness";
import { useDebounce } from "@/hooks/useDebounce";
import { routes } from "@/config/routes";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { useOrderList } from "@/features/orders/orders.hooks";
import { OrderFilters, type OrderFilterValues } from "@/features/orders/components/OrderFilters";
import { OrderWorkspaceContent } from "@/features/orders/pages/OrderDetailsPage";
import { useAssignedOrder } from "../salesperson.hooks";
function BusinessOrders({ businessId }: { businessId: string }) {
  const [filters, setFilters] = useState<OrderFilterValues>({ search: "", status: "all" });
  const debounced = useDebounce(filters); const key = JSON.stringify(debounced);
  const [pagination, setPagination] = useState({ key: "", page: 1 }); const page = pagination.key === key ? pagination.page : 1;
  const orders = useOrderList({ scope: "salesperson", businessId, ...debounced, page });
  const pages = Math.max(1, Math.ceil((orders.data?.total ?? 0) / (orders.data?.pageSize ?? 15)));
  function go(next: number) { setPagination({ key, page: Math.max(1, Math.min(pages, next)) }); }
  return <div className="space-y-4"><OrderFilters value={filters} onChange={setFilters} />
    {orders.isPending ? <Spinner label="Loading assigned-dealer orders" /> : orders.isError ? <div><p role="alert" className="text-sm text-danger">Orders could not load.</p>
      <Button className="mt-3" variant="secondary" onClick={() => { void orders.refetch(); }}>Try again</Button></div> : <>
      {!orders.data.items.length ? <EmptyState title="No permitted orders found" description="Orders for your currently assigned dealers appear here." /> :
        <div className="overflow-x-auto rounded-xl border border-border bg-surface"><table className="w-full min-w-[800px] text-left text-sm">
          <caption className="sr-only">Assigned dealer order history</caption><thead className="bg-soft text-xs text-muted"><tr>{["Order", "Dealer", "Store", "Amount", "Status", "Ordered on"].map((label) => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">{orders.data.items.map((order) => <tr key={order.id}>
            <td className="px-4 py-3"><Link className="font-mono text-xs font-semibold hover:underline" to={`${routes.salesperson.orders}/${order.id}?businessId=${businessId}`}>ORD-{order.orderNumber}</Link></td>
            <td className="px-4 py-3">{order.dealerName}</td><td className="px-4 py-3">{order.storeName}</td>
            <td className="px-4 py-3 font-mono text-xs">{formatCurrency(order.total)}</td><td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
            <td className="px-4 py-3 text-xs">{formatDateTime(order.createdAt)}</td>
          </tr>)}</tbody>
        </table></div>}
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">{orders.data.total} orders · Page {page} of {pages}</p><div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1 || orders.isFetching} onClick={() => go(page - 1)}>Previous</Button>
        <Button size="sm" variant="secondary" disabled={page >= pages || orders.isFetching} onClick={() => go(page + 1)}>Next</Button>
      </div></div>
    </>}
  </div>;
}
export default function SalespersonOrdersPage() {
  const { activeBusinessId } = useBusiness();
  return <div className="space-y-6"><PageHeader title="Order history" description="Permitted orders for dealers currently assigned to you." />
    {activeBusinessId && <BusinessOrders key={activeBusinessId} businessId={activeBusinessId} />}
  </div>;
}
function AssignedOrderDetails({ businessId, orderId }: { businessId: string; orderId: string }) {
  const result = useAssignedOrder(businessId, orderId);
  if (result.isPending) return <Spinner label="Loading assigned order" />;
  if (result.isError) return <div><p role="alert" className="text-sm text-danger">Order unavailable for the selected employer and assignment.</p>
    <Button className="mt-3" variant="secondary" onClick={() => { void result.refetch(); }}>Try again</Button></div>;
  return <OrderWorkspaceContent workspace={result.data} mode="salesperson" businessId={businessId} />;
}
export function SalespersonOrderDetailsPage() {
  const { orderId } = useParams(); const { activeBusinessId } = useBusiness();
  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success || !activeBusinessId) return <EmptyState title="Invalid order workspace" />;
  return <AssignedOrderDetails key={`${activeBusinessId}:${parsed.data}`} businessId={activeBusinessId} orderId={parsed.data} />;
}
