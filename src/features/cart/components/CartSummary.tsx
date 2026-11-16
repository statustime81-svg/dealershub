import { formatCurrency } from "@/lib/formatters";
import type { CartQuote } from "../cart.schemas";
export function CartSummary({ quote }: { quote: CartQuote }) {
  const rows: [string, number | null][] = [
    ["Subtotal", quote.subtotal],
    ["Discount", quote.discountTotal],
    [quote.taxIncluded ? "Tax (18%, included)" : "Tax (18%)", quote.taxTotal],
    ["Delivery", quote.deliveryTotal],
  ];
  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold">Order summary</h2>
      <dl className="space-y-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 text-sm"
          >
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-mono text-xs">
              {value === null ? "Awaiting confirmation" : formatCurrency(value)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-lime/20 p-3">
        <span className="text-sm font-semibold">Total</span>
        <strong className="font-mono text-base">
          {quote.total === null ? "Not confirmed" : formatCurrency(quote.total)}
        </strong>
      </div>
      <p className="text-xs leading-5 text-muted">
        Cart estimate before selecting payment terms. Final amounts are
        calculated at checkout.
      </p>
      {!quote.pricingReady && (
        <p className="text-xs leading-5 text-muted">
          Manufacturer checkout terms are not configured yet. Ask your supplier
          to complete Business settings → Checkout terms.
        </p>
      )}
    </section>
  );
}
