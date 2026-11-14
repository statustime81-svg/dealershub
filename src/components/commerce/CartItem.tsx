import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { PrivateImage } from "@/components/shared/PrivateImage";
import { routeBuilders } from "@/config/routes";
import { formatCurrency } from "@/lib/formatters";
import { QuantityStepper } from "./QuantityStepper";
import type { CartLine } from "@/features/cart/cart.schemas";
export function CartItem({ item, storeId, disabled, onUpdate, onRemove }: {
  item: CartLine; storeId: string; disabled: boolean;
  onUpdate: (quantity: number) => void; onRemove: () => void;
}) {
  const [quantity, setQuantity] = useState(String(item.quantity));
  const number = Number(quantity);
  const valid = Number.isSafeInteger(number) && number >= item.moq && number <= 2147483647 &&
    (number - item.moq) % item.quantityStep === 0 && (item.stockQuantity === null || number <= item.stockQuantity);
  return <article className="flex flex-col gap-4 border-b border-border p-4 last:border-b-0 sm:flex-row sm:p-5">
    <PrivateImage path={item.imagePath} alt={item.name} className="size-24 shrink-0" />
    <div className="min-w-0 flex-1 space-y-3">
      <div><Link to={routeBuilders.storeProduct(storeId, item.productId)} className="text-sm font-semibold hover:underline">{item.name}</Link>
        <p className="mt-1 text-xs text-muted">{item.variantName}{item.packSize ? ` · ${item.packSize}` : ""}</p>
        <p className="mt-2 font-mono text-sm">{formatCurrency(item.price)} / {item.unit}</p></div>
      {!item.isOrderable && <p className="text-xs text-danger">Review availability, stock and minimum quantity before ordering.</p>}
      <QuantityStepper value={quantity} onChange={setQuantity} min={item.moq} step={item.quantityStep}
        max={item.stockQuantity ?? 2147483647} disabled={disabled} label={`Quantity (${item.unit})`}
        error={!valid ? "Check stock, MOQ and quantity increment." : undefined} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={disabled || !valid || number === item.quantity} onClick={() => onUpdate(number)}>Update quantity</Button>
        <Button size="sm" variant="danger" disabled={disabled} onClick={onRemove}>Remove</Button>
      </div>
    </div>
    <p className="font-mono text-sm font-semibold">{formatCurrency(item.lineTotal)}</p>
  </article>;
}
