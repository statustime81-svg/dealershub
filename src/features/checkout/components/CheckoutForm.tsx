import { Button } from "@/components/ui/Button";
import { CartSummary } from "@/features/cart/components/CartSummary";
import type { CartQuote } from "@/features/cart/cart.schemas";
export function CheckoutForm({ quote, busy, error, onSubmit }: {
  quote: CartQuote; busy: boolean; error: boolean; onSubmit: () => Promise<void>;
}) {
  return <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (quote.canSubmit && !busy) void onSubmit(); }}>
    <CartSummary quote={quote} />
    {!quote.items.every((item) => item.isOrderable) && <p role="alert" className="text-sm text-danger">Some items need updated quantities or are no longer available. Return to the cart to review them.</p>}
    {error && <p role="alert" className="text-sm text-danger">Order could not be submitted. Review refreshed cart details before retrying. Final business terms may still need confirmation.</p>}
    <Button type="submit" className="w-full" disabled={!quote.canSubmit} isLoading={busy} loadingText="Placing order…">Place order</Button>
    <p className="text-xs leading-5 text-muted">Submitted orders are sent to the manufacturer for review. This does not collect an online payment.</p>
  </form>;
}
