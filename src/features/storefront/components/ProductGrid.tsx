import { ProductCard } from "@/components/commerce/ProductCard";
import { EmptyState } from "@/components/shared/EmptyState";
import type { StoreProductCard } from "../storefront.schemas";
export function ProductGrid({ products }: { products: StoreProductCard[] }) {
  if (!products.length) return <EmptyState title="No products found" description="Try a different category or search." />;
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
    {products.map((product) => <ProductCard key={product.id} product={product} compact />)}
  </div>;
}
