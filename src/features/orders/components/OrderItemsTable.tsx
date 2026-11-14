import { formatCurrency } from "@/lib/formatters";
import type { OrderWorkspace } from "../orders.schemas";
export function OrderItemsTable({ items }: { items: OrderWorkspace["items"] }) {
  return <div className="overflow-x-auto rounded-xl border border-border bg-surface">
    <table className="w-full min-w-[650px] text-left text-sm"><caption className="sr-only">Purchase-time order items</caption>
      <thead className="bg-soft text-xs text-muted"><tr>{["Product", "Price", "Quantity", "Total"].map((label) => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}</tr></thead>
      <tbody className="divide-y divide-border">{items.map((item) => <tr key={item.id}>
        <td className="px-4 py-3"><p className="font-medium">{item.productName}</p>
          <p className="mt-1 text-xs text-muted">{item.variantName}{item.packSize ? ` · ${item.packSize}` : ""}</p>
          {item.sku && <p className="mt-1 font-mono text-xs text-muted">{item.sku}</p>}</td>
        <td className="px-4 py-3 font-mono text-xs">{formatCurrency(item.price)}</td>
        <td className="px-4 py-3 text-xs">{item.quantity} {item.unit}</td>
        <td className="px-4 py-3 font-mono text-xs">{formatCurrency(item.total)}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}
