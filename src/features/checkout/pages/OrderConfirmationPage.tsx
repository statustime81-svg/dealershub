import { Link, useParams } from "react-router-dom";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { routes } from "@/config/routes";
import { orderStatuses } from "@/config/order-statuses";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { useOrderConfirmation } from "../checkout.hooks";
function Confirmation({ orderId }: { orderId: string }) {
  const result = useOrderConfirmation(orderId);
  if (result.isPending) return <Spinner label="Loading order confirmation" />;
  if (result.isError) return <div><p role="alert" className="text-sm text-danger">Order confirmation is unavailable or could not load.</p>
    <Button variant="secondary" className="mt-3" onClick={() => { void result.refetch(); }}>Try again</Button></div>;
  const order = result.data; const status = orderStatuses[order.status];
  return <section className="mx-auto max-w-2xl space-y-5 rounded-xl border border-border bg-surface p-6 sm:p-8">
    <CheckCircle2 size={32} className="text-success" aria-hidden="true" />
    <h1 className="text-2xl font-bold">Order submitted</h1>
    <p className="font-mono text-lg">ORD-{order.orderNumber}</p>
    <Badge variant={status.variant}>{status.label}</Badge>
    <p className="text-sm leading-6 text-muted">{order.businessName} has received your order for review. Order submission does not confirm payment or acceptance.</p>
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between gap-4"><dt className="text-muted">Store</dt><dd>{order.storeName}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-muted">Submitted</dt><dd>{formatDateTime(order.createdAt)}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-muted">Subtotal</dt><dd className="font-mono">{formatCurrency(order.subtotal)}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-muted">Discount</dt><dd className="font-mono">{formatCurrency(order.discountTotal)}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-muted">Tax</dt><dd className="font-mono">{formatCurrency(order.taxTotal)}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-muted">Delivery</dt><dd className="font-mono">{formatCurrency(order.deliveryTotal)}</dd></div>
      <div className="flex justify-between gap-4 border-t border-border pt-3 font-semibold"><dt>Total</dt><dd className="font-mono">{formatCurrency(order.total)}</dd></div>
    </dl>
    <Link to={routes.dealer.stores} className="inline-flex min-h-11 items-center rounded-lg bg-lime px-4 text-sm font-semibold">Back to your stores</Link>
  </section>;
}
export default function OrderConfirmationPage() {
  const { orderId } = useParams(); const parsed = z.string().uuid().safeParse(orderId);
  return parsed.success ? <Confirmation orderId={parsed.data} /> : <EmptyState title="Invalid order link" />;
}
