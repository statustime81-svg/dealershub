import { OrderTermsPanel } from "@/features/checkout/components/OrderTermsPanel";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { OrderStatusBadge } from "@/components/commerce/OrderStatusBadge";
import { OrderTimeline } from "@/components/commerce/OrderTimeline";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { routeBuilders, routes } from "@/config/routes";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import type { OrderWorkspace } from "../orders.schemas";
import { useOrderWorkspace } from "../orders.hooks";
import { OrderItemsTable } from "../components/OrderItemsTable";
import { OrderStatusControls } from "../components/OrderStatusControls";
import { InvoiceDownload } from "../components/InvoiceDownload";
function OrderWorkspaceView({
  orderId,
  mode,
  trackingOnly,
}: {
  orderId: string;
  mode: "manufacturer" | "dealer";
  trackingOnly: boolean;
}) {
  const result = useOrderWorkspace(orderId);
  if (result.isPending) return <Spinner label="Loading order details" />;
  if (result.isError)
    return (
      <div>
        <p role="alert" className="text-sm text-danger">
          Order details are unavailable or could not load. Check your access and
          connection.
        </p>
        <Button
          className="mt-3"
          variant="secondary"
          onClick={() => {
            void result.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  return (
    <OrderWorkspaceContent
      workspace={result.data}
      mode={mode}
      trackingOnly={trackingOnly}
    />
  );
}
export function OrderWorkspaceContent({
  workspace,
  mode,
  trackingOnly = false,
  businessId,
}: {
  workspace: OrderWorkspace;
  mode: "manufacturer" | "dealer" | "salesperson";
  trackingOnly?: boolean;
  businessId?: string;
}) {
  const order = workspace.order;
  const detailHref =
    mode === "manufacturer"
      ? routeBuilders.manufacturerOrder(order.id)
      : mode === "salesperson"
        ? `${routes.salesperson.orders}/${order.id}?businessId=${businessId ?? ""}`
        : routeBuilders.dealerOrder(order.id);
  const totals: [string, number][] = [
    ["Subtotal", order.subtotal],
    ["Discount", order.discountTotal],
    [order.taxIncluded ? "Tax (18%, included)" : "Tax (18%)", order.taxTotal],
    ["Delivery", order.deliveryTotal],
    ["Total", order.total],
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title={
          trackingOnly
            ? `Track ORD-${order.orderNumber}`
            : `ORD-${order.orderNumber}`
        }
        description={`${order.businessName} · ${order.storeName}`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              to={
                mode === "manufacturer"
                  ? routes.manufacturer.orders
                  : mode === "salesperson"
                    ? `${routes.salesperson.orders}?businessId=${businessId ?? ""}`
                    : routes.dealer.orders
              }
              className="inline-flex min-h-11 items-center text-sm font-medium text-info"
            >
              All orders
            </Link>
            {mode === "dealer" && (
              <Link
                to={
                  trackingOnly
                    ? detailHref
                    : routeBuilders.orderTracking(order.id)
                }
                className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium"
              >
                {trackingOnly ? "View details" : "Track order"}
              </Link>
            )}
          </div>
        }
      />
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5">
        <OrderStatusBadge status={order.status} />
        <p className="text-xs text-muted">
          Ordered on {formatDateTime(order.createdAt)}
        </p>
        <p className="text-xs text-muted">
          Last updated {formatDateTime(order.updatedAt)}
        </p>
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {!trackingOnly && <OrderItemsTable items={workspace.items} />}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-5 text-lg font-semibold">Order history</h2>
            <OrderTimeline history={workspace.history} />
          </section>
          {!trackingOnly && (
            <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold">Dealer details</h2>
              <p className="text-sm font-medium">{order.dealerName}</p>
              <p className="text-sm text-muted">
                Phone: {order.dealerPhone || "—"}
              </p>
              <div>
                <p className="text-xs text-muted">Dealer profile address</p>
                <p className="mt-1 whitespace-pre-line text-sm">
                  {order.dealerAddress || "—"}
                </p>
              </div>
              <p className="text-sm text-muted">
                Salesperson: {order.salespersonName || "Dealer placed order"}
              </p>
            </section>
          )}
        </div>
        <aside className="space-y-5">
          <OrderTermsPanel
            orderId={order.id}
            canManage={mode === "manufacturer" && workspace.canManage}
            trackingOnly={trackingOnly}
            orderStatus={order.status}
          />
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-lg font-semibold">Order totals</h2>
            <dl className="space-y-3">
              {totals.map(([label, value]) => (
                <div
                  key={label}
                  className={`flex items-center justify-between gap-4 text-sm ${label === "Total" ? "border-t border-border pt-3 font-semibold" : ""}`}
                >
                  <dt>{label}</dt>
                  <dd className="font-mono text-xs">{formatCurrency(value)}</dd>
                </div>
              ))}
            </dl>
          </section>
          {!trackingOnly && <InvoiceDownload documents={workspace.documents} />}
          {mode === "manufacturer" && workspace.canManage && (
            <OrderStatusControls
              key={`${order.id}:${order.status}:${order.updatedAt}`}
              workspace={workspace}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
export default function OrderDetailsPage({
  mode = "manufacturer",
  trackingOnly = false,
}: {
  mode?: "manufacturer" | "dealer";
  trackingOnly?: boolean;
}) {
  const { orderId } = useParams();
  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) return <EmptyState title="Invalid order link" />;
  return (
    <OrderWorkspaceView
      key={`${mode}:${parsed.data}:${trackingOnly}`}
      orderId={parsed.data}
      mode={mode}
      trackingOnly={trackingOnly}
    />
  );
}
