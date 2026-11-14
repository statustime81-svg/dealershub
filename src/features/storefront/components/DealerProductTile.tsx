import { Link } from "react-router-dom";
import { ArrowUpRight, Package } from "lucide-react";
import { PrivateImage } from "@/components/shared/PrivateImage";
import { routeBuilders } from "@/config/routes";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import type { StoreProductCard } from "../storefront.schemas";
const availability = { in_stock: "In stock", low_stock: "Low stock", out_of_stock: "Out of stock", enquire: "Enquire" };
export function DealerProductTile({ product }: { product: StoreProductCard }) {
  const href = routeBuilders.storeProduct(product.storeId, product.id); const variant = product.variant;
  return <article className="ds-product-tile">
    <Link className="ds-product-image-link" to={href} aria-label={`View ${product.name}`}><PrivateImage path={product.imagePath} alt={product.name} className="ds-product-image"/><span className={`ds-stock-badge ds-stock-${variant.availability}`}><i/>{availability[variant.availability]}</span></Link>
    <div className="ds-product-body"><p className="ds-product-brand">{product.brandName ?? product.categoryName ?? "Wholesale catalog"}</p><Link className="ds-product-title" to={href}>{product.name}</Link><p className="ds-product-variant">{variant.name}{variant.packSize ? ` · ${variant.packSize}` : ""}</p><div className="ds-product-price"><strong>{formatCurrency(variant.price)}</strong><span>/ {product.unit}</span></div><p className="ds-product-moq"><Package size={12}/> MOQ: {formatNumber(variant.moq)} {product.unit}{product.variantCount > 1 ? ` · ${product.variantCount} variants` : ""}</p><Link className="ds-product-action" to={href}>View product <ArrowUpRight size={16}/></Link></div>
  </article>;
}
