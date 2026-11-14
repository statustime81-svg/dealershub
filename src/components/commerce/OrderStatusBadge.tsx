import { Badge } from "@/components/ui/Badge";
import { orderStatuses } from "@/config/order-statuses";
import type { OrderStatus } from "@/types/order";
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const entry = orderStatuses[status];
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
