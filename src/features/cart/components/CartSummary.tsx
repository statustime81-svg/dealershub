import { formatCurrency } from "@/lib/formatters";
import type { CartQuote } from "../cart.schemas";
export function CartSummary({ quote }: { quote: CartQuote }) {
  const rows: [string, number | null][] = [
    ["Subtotal", quote.subtotal], ["Discount", quote.discountTotal],
    ["Tax", quote.taxTotal], ["Delivery", quote.deliveryTotal],
  ];
  return <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
    <h2 className="text-lg font-semibold">Order summary</h2>
    <dl className="space-y-3">{rows.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4 text-sm">
      <dt className="text-muted">{label}</dt><dd className="text-right font-mono text-xs">{value === null ? "Awaiting confirmation" : formatCurrency(value)}</dd>
    </div>)}</dl>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-lime/20 p-3">
      <span className="text-sm font-semibold">Total</span>
      <strong className="font-mono text-base">{quote.total === null ? "Not confirmed" : formatCurrency(quote.total)}</strong>
    </div>
    {!quote.pricingReady && <p className="text-xs leading-5 text-muted">Final order charges are awaiting confirmation. You can review your cart; order placement is currently unavailable.</p>}
  </section>;
}
