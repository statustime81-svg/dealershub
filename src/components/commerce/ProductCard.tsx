import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { PrivateImage } from "@/components/shared/PrivateImage";
import { routeBuilders } from "@/config/routes";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import type { StoreProductCard } from "@/features/storefront/storefront.schemas";
const labels = { in_stock: "In stock", low_stock: "Low stock", out_of_stock: "Out of stock", enquire: "Enquire" };
export function ProductCard({ product }: { product: StoreProductCard }) {
  const href = routeBuilders.storeProduct(product.storeId, product.id);
  const variant = product.variant;
  return <article className="flex flex-col rounded-xl border border-border bg-surface p-3 sm:p-4">
    <Link to={href} aria-label={`View ${product.name}`}>
      <PrivateImage path={product.imagePath} alt={product.name} className="aspect-square" />
    </Link>
    <div className="mt-3 flex flex-1 flex-col">
      <Link to={href} className="text-sm font-semibold leading-5 hover:underline">{product.name}</Link>
      <p className="mt-1 text-xs text-muted">{product.brandName || product.categoryName || "Wholesale product"}</p>
      {product.variantCount > 1 && <p className="mt-2 text-xs text-muted">{product.variantCount} variants · Showing {variant.name}</p>}
      <p className="mt-3 font-mono text-base font-semibold tabular-nums">{formatCurrency(variant.price)}</p>
      <p className="mt-1 text-xs">MOQ: {formatNumber(variant.moq)} {product.unit}</p>
      {variant.packSize && <p className="mt-1 text-xs text-muted">Pack size: {variant.packSize}</p>}
      <div className="mt-3"><Badge variant={variant.availability === "out_of_stock" ? "danger" : variant.availability === "in_stock" ? "success" : "warning"}>{labels[variant.availability]}</Badge></div>
      <Link to={href} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-lime px-3 text-sm font-semibold text-midnight hover:bg-lime-hover">View product</Link>
    </div>
  </article>;
}
