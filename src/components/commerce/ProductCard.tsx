import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { PrivateImage } from "@/components/shared/PrivateImage";
import { routeBuilders } from "@/config/routes";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import type { StoreProductCard } from "@/features/storefront/storefront.schemas";
const labels = { in_stock: "In stock", low_stock: "Low stock", out_of_stock: "Out of stock", enquire: "Enquire" };
export function ProductCard({ product, compact = false }: { product: StoreProductCard; compact?: boolean }) {
  const href = routeBuilders.storeProduct(product.storeId, product.id);
  const variant = product.variant;
  return <article className={`group flex min-w-0 flex-col rounded-xl border border-border bg-surface transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-lime-hover/60 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none ${compact ? "p-3" : "p-3 sm:p-4"}`}>
    <Link to={href} aria-label={`View ${product.name}`}>
      <PrivateImage path={product.imagePath} alt={product.name} className={compact ? "h-32 w-full bg-white p-2 sm:h-36" : "aspect-square"} />
    </Link>
    <div className="mt-3 flex flex-1 flex-col">
      <Link to={href} className="text-sm font-semibold leading-5 hover:underline">{product.name}</Link>
      <p className="mt-1 text-xs text-muted">{product.brandName || product.categoryName || "Wholesale product"}</p>
      {product.variantCount > 1 && <p className="mt-2 text-xs text-muted">{product.variantCount} variants · Showing {variant.name}</p>}
      <p className={`${compact ? "mt-2" : "mt-3"} font-mono text-base font-semibold tabular-nums`}>{formatCurrency(variant.price)}</p>
      <p className="mt-1 text-xs">MOQ: {formatNumber(variant.moq)} {product.unit}</p>
      {variant.packSize && <p className="mt-1 text-xs text-muted">Pack size: {variant.packSize}</p>}
      <div className="mt-3"><Badge variant={variant.availability === "out_of_stock" ? "danger" : variant.availability === "in_stock" ? "success" : "warning"}>{labels[variant.availability]}</Badge></div>
      <Link to={href} className={`inline-flex items-center justify-center rounded-lg bg-lime px-3 font-semibold text-midnight hover:bg-lime-hover ${compact ? "mt-3 min-h-9 text-xs" : "mt-4 min-h-11 text-sm"}`}>View product</Link>
    </div>
  </article>;
}
