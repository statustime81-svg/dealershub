import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PrivateImage } from "@/components/shared/PrivateImage";
import { routeBuilders } from "@/config/routes";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import type { StoreProductCard } from "../storefront.schemas";
export function DealerHomeProductTile({ product }: { product: StoreProductCard }) {
  const href = routeBuilders.storeProduct(product.storeId, product.id);
  return <article className="group flex min-w-0 flex-col rounded-2xl border border-border/70 bg-white p-3 shadow-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-lime-hover/60 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none">
    <Link to={href} aria-label={`View ${product.name}`}><PrivateImage path={product.imagePath} alt={product.name} className="h-36 w-full bg-white p-3 transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none"/></Link>
    <Link to={href} className="mt-3 line-clamp-2 text-sm font-semibold leading-5 tracking-tight">{product.name}</Link>
    <p className="mt-1 truncate text-xs text-muted">{product.variant.name}{product.variant.packSize ? ` · ${product.variant.packSize}` : ""}</p>
    <p className="mt-2"><strong className="text-lg font-semibold tracking-tight">{formatCurrency(product.variant.price)}</strong><span className="ml-1 text-xs text-muted">/ {product.unit}</span></p>
    <p className="mt-1 text-xs text-muted">MOQ: {formatNumber(product.variant.moq)} {product.unit}</p>
    <Link to={href} className="mt-3 inline-flex min-h-9 items-center justify-between gap-2 rounded-lg bg-[#f3f8e8] px-3 text-xs font-semibold text-[#597b0b] transition-colors group-hover:bg-lime motion-reduce:transition-none">View product <ArrowRight size={16}/></Link>
  </article>;
}
