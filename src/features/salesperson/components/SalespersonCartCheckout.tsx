import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { QuantityStepper } from "@/components/commerce/QuantityStepper";
import { PrivateImage } from "@/components/shared/PrivateImage";
import { EmptyState } from "@/components/shared/EmptyState";
import { CartSummary } from "@/features/cart/components/CartSummary";
import { useCart, useCartMutation } from "@/features/cart/cart.hooks";
import type { CartLine } from "@/features/cart/cart.schemas";
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";
import { useSubmitOrder } from "@/features/checkout/checkout.hooks";
import { routes } from "@/config/routes";
import { formatCurrency } from "@/lib/formatters";
import type { SalespersonShoppingScope } from "../salesperson.schemas";
function AssignmentCartLine({
  item,
  busy,
  onUpdate,
  onRemove,
}: {
  item: CartLine;
  busy: boolean;
  onUpdate: (quantity: number) => void;
  onRemove: () => void;
}) {
  const [quantity, setQuantity] = useState(String(item.quantity));
  const number = Number(quantity);
  const valid =
    Number.isSafeInteger(number) &&
    number >= item.moq &&
    number <= 2147483647 &&
    (number - item.moq) % item.quantityStep === 0 &&
    (item.stockQuantity === null || number <= item.stockQuantity);
  return (
    <article className="flex flex-col gap-3 border-b border-border p-3 last:border-0 sm:flex-row sm:p-4">
      <PrivateImage
        path={item.imagePath}
        alt={item.name}
        className="size-14 shrink-0 sm:size-16"
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <h3 className="text-sm font-semibold">{item.name}</h3>
          <p className="mt-1 text-xs text-muted">
            {item.variantName}
            {item.packSize ? ` · ${item.packSize}` : ""}
          </p>
        </div>
        {!item.isOrderable && (
          <p className="text-xs text-danger">
            Check availability, stock and quantity before ordering.
          </p>
        )}
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          min={item.moq}
          step={item.quantityStep}
          max={item.stockQuantity ?? 2147483647}
          disabled={busy}
          label={`Quantity (${item.unit})`}
          error={valid ? undefined : "Check MOQ, increment and stock."}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || !valid || number === item.quantity}
            onClick={() => onUpdate(number)}
          >
            Update
          </Button>
          <Button size="sm" variant="danger" disabled={busy} onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
      <p className="font-mono text-sm">{formatCurrency(item.lineTotal)}</p>
    </article>
  );
}
export function SalespersonCartCheckout({
  scope,
}: {
  scope: SalespersonShoppingScope;
}) {
  const navigate = useNavigate();
  const cart = useCart(scope.storeId, scope.dealerId);
  const mutation = useCartMutation(scope.storeId, scope.dealerId);
  const submit = useSubmitOrder(scope.storeId, scope.dealerId);
  const [review, setReview] = useState(false);
  if (cart.isPending) return <Spinner label="Loading selected dealer cart" />;
  if (cart.isError)
    return (
      <div>
        <p role="alert" className="text-sm text-danger">
          Dealer cart could not load. Check assignment and store access.
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
        title="This dealer's cart is empty"
        description="Open Catalog and add products for the selected dealer."
      />
    );
  const quote = cart.data;
  if (review)
    return (
      <div className="space-y-5">
        <Button
          variant="secondary"
          disabled={submit.isPending}
          onClick={() => setReview(false)}
        >
          Back to dealer cart
        </Button>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold">Review dealer order</h2>
            <div className="mt-3 divide-y divide-border">
              {quote.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 py-4">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      {item.variantName} · {item.quantity} {item.unit}
                    </p>
                  </div>
                  <p className="font-mono text-sm">
                    {formatCurrency(item.lineTotal)}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <CheckoutForm
            dealerId={scope.dealerId}
            quote={quote}
            busy={submit.isPending}
           error={
              submit.isError
                ? submit.error instanceof Error
                  ? submit.error.message
                  : "Order could not complete. Please try again."
                : null
            }
            onSubmit={async (input) => {
              try {
                const result = await submit.mutateAsync(input);
                navigate(
                  `${routes.salesperson.orders}/${result.orderId}?businessId=${scope.businessId}`,
                  { replace: true },
                );
              } catch {
                await cart.refetch();
              }
            }}
          />
        </div>
      </div>
    );
  return (
    <div className="space-y-4">
      {mutation.isError && (
        <p role="alert" className="text-sm text-danger">
          Cart update failed. Check refreshed quantities and assignment access.
        </p>
      )}
      {mutation.isSuccess && (
        <p role="status" className="text-sm text-success">
          Dealer cart updated.
        </p>
      )}
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-xl border border-border bg-surface">
          {quote.items.map((item) => (
            <AssignmentCartLine
              key={`${item.id}:${item.quantity}:${item.moq}:${item.quantityStep}:${item.stockQuantity}`}
              item={item}
              busy={mutation.isPending || cart.isFetching}
              onUpdate={(quantity) =>
                mutation.mutate({
                  storeId: scope.storeId,
                  variantId: item.variantId,
                  quantity,
                  mode: "set",
                  expectedQuantity: item.quantity,
                })
              }
              onRemove={() =>
                mutation.mutate({
                  storeId: scope.storeId,
                  variantId: item.variantId,
                  quantity: 0,
                  mode: "remove",
                  expectedQuantity: item.quantity,
                })
              }
            />
          ))}
        </section>
        <div className="space-y-3">
          <CartSummary quote={quote} />
          <Button
            className="w-full"
            disabled={mutation.isPending}
            onClick={() => setReview(true)}
          >
            Review checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
