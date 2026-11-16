import { PrivateImage } from "@/components/shared/PrivateImage";
import { CheckoutSuggestions } from "../components/CheckoutSuggestions";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { routeBuilders } from "@/config/routes";
import { formatCurrency } from "@/lib/formatters";
import { useCart } from "@/features/cart/cart.hooks";
import { CheckoutForm } from "../components/CheckoutForm";
import { useSubmitOrder } from "../checkout.hooks";
function StoreCheckout({ storeId }: { storeId: string }) {
  const cart = useCart(storeId);
  const submit = useSubmitOrder(storeId);
  const navigate = useNavigate();
  if (cart.isPending) return <Spinner label="Reviewing checkout" />;
  if (cart.isError)
    return (
      <div>
        <p role="alert" className="text-sm text-danger">
          Checkout could not load.
        </p>
        <Button
          className="mt-3"
          variant="secondary"
          onClick={() => {
            void cart.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  if (!cart.data.items.length)
    return (
      <EmptyState
        title="No items to order"
        description="Add products to this store's cart first."
        action={
          <Link
            to={routeBuilders.storeProducts(storeId)}
            className="inline-flex min-h-11 items-center text-info"
          >
            Browse products
          </Link>
        }
      />
    );
  const quote = cart.data;
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-5">
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Review your items</h2>
        <div className="mt-4 divide-y divide-border">
          {quote.items.map((item) => (
            <article key={item.id} className="flex items-center gap-3 py-4">
              <Link to={routeBuilders.storeProduct(storeId, item.productId)} aria-label={`View ${item.name}`} className="shrink-0 rounded-xl focus-visible:outline-2 focus-visible:outline-info">
                <PrivateImage path={item.imagePath} alt={item.name} className="size-14 border border-border bg-white p-1 sm:size-16" />
              </Link>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium">{item.name}</h3>
                <p className="mt-1 text-xs text-muted">
                  {item.variantName} · {item.quantity} {item.unit}
                </p>
              </div>
              <p className="font-mono text-sm">
                {formatCurrency(item.lineTotal)}
              </p>
            </article>
          ))}
        </div>
        <Link
          to={routeBuilders.cart(storeId)}
          className="inline-flex min-h-11 items-center text-sm text-info"
        >
          Edit cart
        </Link>
      </section>
      <CheckoutSuggestions storeId={storeId} productIds={quote.items.map(item => item.productId)} />
      </div>
      <CheckoutForm
        quote={quote}
        busy={submit.isPending}
        error={submit.isError ? (submit.error instanceof Error ? submit.error.message : "Order could not complete. Review checkout and retry.") : null}
        onSubmit={async (input) => {
          try {
            const result = await submit.mutateAsync(input);
            navigate(routeBuilders.orderConfirmation(result.orderId), {
              replace: true,
            });
          } catch {
            await cart.refetch();
          }
        }}
      />
    </div>
  );
}
export default function CheckoutPage() {
  const { storeId = "" } = useParams();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Checkout"
        description="Review the current wholesale quantities and confirmed order totals."
      />
      <StoreCheckout key={storeId} storeId={storeId} />
    </div>
  );
}
