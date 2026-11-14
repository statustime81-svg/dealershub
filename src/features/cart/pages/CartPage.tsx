import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { CartItem } from "@/components/commerce/CartItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { routeBuilders } from "@/config/routes";
import { useCart, useCartMutation } from "../cart.hooks";
import { CartSummary } from "../components/CartSummary";
function StoreCart({ storeId }: { storeId: string }) {
  const cart = useCart(storeId); const mutation = useCartMutation(storeId);
  if (cart.isPending) return <Spinner label="Loading cart" />;
  if (cart.isError) return <div><p role="alert" className="text-sm text-danger">Cart could not load. Check your store access and connection.</p>
    <Button className="mt-3" variant="secondary" onClick={() => { void cart.refetch(); }}>Try again</Button></div>;
  if (!cart.data.items.length) return <EmptyState title="Your cart is empty" description="Choose products from this wholesale store."
    action={<Link to={routeBuilders.storeProducts(storeId)} className="inline-flex min-h-11 items-center rounded-lg bg-lime px-4 text-sm font-semibold">Browse products</Link>} />;
  return <div className="space-y-4">
    {mutation.isError && <p role="alert" className="text-sm text-danger">Cart update failed. Check the refreshed quantities, stock and MOQ before retrying.</p>}
    {mutation.isSuccess && <p role="status" className="text-sm text-success">Cart updated.</p>}
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section aria-label="Cart items" className="rounded-xl border border-border bg-surface">
        {cart.data.items.map((item) => <CartItem key={`${item.id}:${item.quantity}:${item.moq}:${item.quantityStep}:${item.stockQuantity}`}
          item={item} storeId={storeId} disabled={mutation.isPending || cart.isFetching}
          onUpdate={(quantity) => mutation.mutate({ storeId, variantId: item.variantId, quantity, mode: "set", expectedQuantity: item.quantity })}
          onRemove={() => mutation.mutate({ storeId, variantId: item.variantId, quantity: 0, mode: "remove", expectedQuantity: item.quantity })} />)}
      </section>
      <div className="space-y-3"><CartSummary quote={cart.data} />
        <Link to={routeBuilders.checkout(storeId)} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-lime px-4 text-sm font-semibold text-midnight">Review checkout</Link>
      </div>
    </div>
  </div>;
}
export default function CartPage() {
  const { storeId = "" } = useParams();
  return <div className="space-y-6"><PageHeader title="Your cart" description="Review quantities and wholesale order details."
    actions={<Link to={routeBuilders.storeProducts(storeId)} className="inline-flex min-h-11 items-center text-sm font-medium text-info">Continue shopping</Link>} />
    <StoreCart key={storeId} storeId={storeId} />
  </div>;
}
