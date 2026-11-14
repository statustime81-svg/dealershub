import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatDateTime } from "@/lib/formatters";
import type { OrderWorkspace } from "@/features/orders/orders.schemas";
export function OrderTimeline({ history }: { history: OrderWorkspace["history"] }) {
  if (!history.length) return <p className="text-sm text-muted">No status history is available.</p>;
  return <ol aria-label="Order status history" className="space-y-5 border-l border-border pl-5">
    {history.map((event) => <li key={event.id} className="relative">
      <span className="absolute -left-[25px] top-1.5 size-2 rounded-full bg-midnight" aria-hidden="true" />
      <OrderStatusBadge status={event.status} />
      <p className="mt-2 text-xs text-muted">{formatDateTime(event.createdAt)}</p>
      {event.note && <p className="mt-2 whitespace-pre-line text-sm leading-6">{event.note}</p>}
    </li>)}
  </ol>;
}
