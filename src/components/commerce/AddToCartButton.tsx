import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { routeBuilders } from "@/config/routes";
import { useCartMutation } from "@/features/cart/cart.hooks";
export function AddToCartButton({ storeId, variantId, quantity, disabled }: {
  storeId: string; variantId: string; quantity: number; disabled: boolean;
}) {
  const mutation = useCartMutation(storeId);
  return <div className="space-y-3">
    <Button className="w-full" disabled={disabled} isLoading={mutation.isPending} loadingText="Adding…"
      onClick={() => mutation.mutate({ storeId, variantId, quantity, mode: "add" })}>
      <ShoppingCart size={17} aria-hidden="true" />Add to cart
    </Button>
    {mutation.isError && <p role="alert" className="text-xs text-danger">Could not add this quantity. Check access, stock and MOQ. If it is already in your cart, adjust its quantity there.</p>}
    {mutation.isSuccess && <p role="status" className="text-sm text-success">Added to cart. <Link to={routeBuilders.cart(storeId)} className="font-medium underline">View cart</Link></p>}
  </div>;
}
