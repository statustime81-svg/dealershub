import { Link } from "react-router-dom";
import { OrderStatusBadge } from "@/components/commerce/OrderStatusBadge";
import { routeBuilders } from "@/config/routes";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import type { OrderListRow } from "../orders.schemas";
export function OrdersTable({ orders, mode }: { orders: OrderListRow[]; mode: "manufacturer" | "dealer" }) {
  return <div className="overflow-x-auto rounded-xl border border-border bg-surface">
    <table className="w-full min-w-[900px] text-left text-sm">
      <caption className="sr-only">Orders and current status</caption>
      <thead className="bg-soft text-xs text-muted"><tr>
        {["Order ID", mode === "manufacturer" ? "Dealer" : "Store", "Items", "Order value", "Status", "Ordered on", "Action"].map((label) =>
          <th key={label} scope="col" className="px-4 py-3">{label}</th>)}
      </tr></thead>
      <tbody className="divide-y divide-border">{orders.map((order) => {
        const href = mode === "manufacturer" ? routeBuilders.manufacturerOrder(order.id) : routeBuilders.dealerOrder(order.id);
        return <tr key={order.id} className="hover:bg-soft/50">
          <td className="px-4 py-3"><Link to={href} className="font-mono text-xs font-semibold hover:underline">ORD-{order.orderNumber}</Link></td>
          <td className="px-4 py-3"><p className="font-medium">{mode === "manufacturer" ? order.dealerName : order.storeName}</p>
            <p className="mt-1 text-xs text-muted">{mode === "manufacturer" ? (order.salespersonName || "Dealer order") : order.businessName}</p></td>
          <td className="px-4 py-3 font-mono text-xs">{order.itemCount}</td>
          <td className="px-4 py-3 font-mono text-xs">{formatCurrency(order.total)}</td>
          <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
          <td className="px-4 py-3 text-xs">{formatDateTime(order.createdAt)}</td>
          <td className="px-4 py-3"><Link to={mode === "dealer" ? routeBuilders.orderTracking(order.id) : href}
            className="inline-flex min-h-10 items-center text-xs font-medium text-info">{mode === "dealer" ? "Track order" : "View details"}</Link></td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}
