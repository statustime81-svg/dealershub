import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { PrivateImage } from "@/components/shared/PrivateImage";
import { EmptyState } from "@/components/shared/EmptyState";
import { routeBuilders } from "@/config/routes";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { useDealerProduct } from "../storefront.hooks";
import type { DealerProduct } from "../storefront.schemas";
const availabilityLabels = { in_stock: "In stock", low_stock: "Low stock", out_of_stock: "Out of stock", enquire: "Enquire" };
function VariantPricing({ variant, unit, storeId }: { variant: DealerProduct["variants"][number]; unit: string; storeId: string }) {
  const [quantity, setQuantity] = useState(String(variant.moq));
  const number = Number(quantity);
  const valid = Number.isSafeInteger(number) && number >= variant.moq && number <= 2147483647 && (number - variant.moq) % variant.quantityStep === 0;
  const exceedsStock = variant.stockQuantity !== null && valid && number > variant.stockQuantity;
  const orderable = valid && !exceedsStock && (variant.availability === "in_stock" || variant.availability === "low_stock");
  return <div className="space-y-4">
    <Badge variant={variant.availability === "out_of_stock" ? "danger" : variant.availability === "in_stock" ? "success" : "warning"}>{availabilityLabels[variant.availability]}</Badge>
    {variant.sku && <p className="font-mono text-xs text-muted">SKU: {variant.sku}</p>}
    <div className="grid gap-3 rounded-lg border border-border bg-soft p-4 sm:grid-cols-3">
      <div><p className="text-xs text-muted">Wholesale price</p><p className="mt-1 font-mono text-xl font-semibold">{formatCurrency(variant.price)}</p></div>
      <div><p className="text-xs text-muted">MOQ</p><p className="mt-1 text-sm font-semibold">{formatNumber(variant.moq)} {unit}</p></div>
      <div><p className="text-xs text-muted">Pack size</p><p className="mt-1 text-sm font-semibold">{variant.packSize ?? "—"}</p></div>
    </div>
    {variant.unitsPerPack !== null && <p className="text-sm text-muted">Units per pack: {formatNumber(variant.unitsPerPack)}</p>}
    <Input label={`Quantity (${unit})`} type="number" min={variant.moq} step={variant.quantityStep} max={2147483647} value={quantity}
      onChange={(event) => setQuantity(event.target.value)}
      hint={`Minimum ${variant.moq}; increase in steps of ${variant.quantityStep}.`}
      error={!valid ? "Enter a quantity matching the MOQ and increment." : exceedsStock ? "Quantity exceeds the current stock." : undefined} />
    <p className="text-sm text-muted">Estimated item total <strong className="ml-2 font-mono text-lg text-foreground">{valid ? formatCurrency(variant.price * number) : "—"}</strong></p>
    <AddToCartButton key={variant.id} storeId={storeId} variantId={variant.id} quantity={valid ? number : variant.moq} disabled={!orderable} />
  </div>;
}
function ProductContent({ product }: { product: DealerProduct }) {
  const [selectedVariant, setSelectedVariant] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const variant = product.variants.find((item) => item.id === selectedVariant) ?? product.variants[0];
  const image = product.images[imageIndex] ?? product.images[0];
  return <div className="space-y-6">
    <p className="text-xs text-muted"><Link to={routeBuilders.storeProducts(product.storeId)} className="hover:underline">Products</Link> / {product.name}</p>
    <div className="grid gap-6 rounded-xl border border-border bg-surface p-4 sm:p-6 lg:grid-cols-2">
      <section aria-label="Product gallery">
        <PrivateImage path={image?.imagePath} alt={image?.altText || product.name} className="aspect-square" />
        {product.images.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {product.images.map((item, index) => <button type="button" key={item.imagePath} aria-label={`Show photo ${index + 1}`} aria-pressed={image === item}
            onClick={() => setImageIndex(index)} className={`size-16 shrink-0 rounded-lg border-2 p-1 ${image === item ? "border-lime-hover" : "border-border"}`}>
            <PrivateImage path={item.imagePath} alt="" className="h-full w-full" />
          </button>)}
        </div>}
      </section>
      <section className="space-y-5">
        <div><p className="text-xs text-muted">{product.brandName || product.categoryName}</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">{product.name}</h2></div>
        {variant ? <>
          <Select label="Select variant" value={variant.id} onChange={(event) => setSelectedVariant(event.target.value)}>
            {product.variants.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
          <VariantPricing key={variant.id} variant={variant} unit={product.unit} storeId={product.storeId} />
        </> : <p className="text-sm text-muted">No active variants available.</p>}
      </section>
    </div>
    <section className="grid gap-5 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
      <div><h3 className="font-semibold">Product description</h3><p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{product.description || "No description provided."}</p></div>
      <div><h3 className="font-semibold">Packaging details</h3><p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{product.packagingDetails || "No additional packaging details provided."}</p></div>
    </section>
  </div>;
}
function ProductDetails({ storeId, productId }: { storeId: string; productId: string }) {
  const product = useDealerProduct(storeId, productId);
  if (product.isPending) return <Spinner label="Loading product details" />;
  if (product.isError) return <div><p role="alert" className="text-sm text-danger">Product unavailable or details could not load.</p>
    <Button className="mt-3" variant="secondary" onClick={() => { void product.refetch(); }}>Try again</Button></div>;
  return <ProductContent key={`${storeId}:${productId}`} product={product.data} />;
}
export default function ProductDetailsPage() {
  const { storeId = "", productId = "" } = useParams();
  if (!z.string().uuid().safeParse(productId).success) return <EmptyState title="Invalid product link" />;
  return <ProductDetails storeId={storeId} productId={productId} />;
}
