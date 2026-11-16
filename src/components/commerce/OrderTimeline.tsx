import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatDateTime } from "@/lib/formatters";
import type { OrderWorkspace } from "@/features/orders/orders.schemas";
export function OrderTimeline({
  history,
}: {
  history: OrderWorkspace["history"];
}) {
  if (!history.length)
    return (
      <p className="text-sm text-muted">No status history is available.</p>
    );
  return (
    <ol
      aria-label="Order status history"
      className="space-y-5 border-l-2 border-lime/50 pl-5"
    >
      {history.map((event) => (
        <li
          key={event.id}
          className="relative rounded-xl bg-soft/60 p-3 transition-colors hover:bg-lime/10 motion-reduce:transition-none"
        >
          <span
            className="absolute -left-[26px] top-5 size-2.5 rounded-full bg-lime-hover ring-4 ring-white"
            aria-hidden="true"
          />
          <OrderStatusBadge status={event.status} />
          <p className="mt-2 text-xs text-muted">
            {formatDateTime(event.createdAt)}
          </p>
          {event.note && (
            <p className="mt-2 whitespace-pre-line text-sm leading-6">
              {event.note}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
