import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PrivateImage } from "@/components/shared/PrivateImage";
import { Button } from "@/components/ui/Button";
import { routeBuilders } from "@/config/routes";
import { formatCurrency } from "@/lib/formatters";
import { getDealerProduct, getDealerProducts, getDealerStore } from "@/features/storefront/storefront.api";
import type { StoreProductCard } from "@/features/storefront/storefront.schemas";

export function CheckoutSuggestions({ storeId, productIds }: { storeId: string; productIds: string[] }) {
  const { user } = useAuth();
  const excluded = [...new Set(productIds)].sort();
  const suggestions = useQuery({
    queryKey: ["user", user?.id, "checkout-suggestions", storeId, excluded],
    enabled: Boolean(user && storeId),
    retry: false,
    queryFn: async ({ signal }) => {
      const filters = { storeId, page: 1, search: "", categoryId: "", brandId: "", sort: "newest" as const };
      const [catalog, store, ...details] = await Promise.allSettled([
        getDealerProducts(filters, signal),
        getDealerStore(storeId, signal),
        ...excluded.slice(0, 4).map(id => getDealerProduct(storeId, id, signal)),
      ]);
      const names = new Set(details.flatMap(result => result.status === "fulfilled" && "categoryName" in result.value && result.value.categoryName ? [result.value.categoryName] : []));
      const categoryIds = store.status === "fulfilled" && "categories" in store.value
        ? store.value.categories.filter(category => names.has(category.name)).map(category => category.id).slice(0, 4) : [];
      const related = await Promise.allSettled(categoryIds.map(categoryId => getDealerProducts({ ...filters, categoryId }, signal)));
      const products = new Map<string, StoreProductCard>();
      const collect = (items: StoreProductCard[]) => items.forEach(product => {
        if (!excluded.includes(product.id) && !["out_of_stock", "enquire"].includes(product.variant.availability)) products.set(product.id, product);
      });
      related.forEach(result => { if (result.status === "fulfilled") collect(result.value.items); });
      if (catalog.status === "fulfilled" && "items" in catalog.value) collect(catalog.value.items);
      if (catalog.status === "rejected" && related.every(result => result.status === "rejected")) throw new Error("Suggestions could not load.");
      return [...products.values()].slice(0, 6);
    },
  });
  return (
    <section aria-label="Suggested products" className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted">Complete your order</p><h2 className="mt-1 text-lg font-semibold">You may also need</h2><p className="mt-1 text-xs text-muted">Related picks from this store.</p></div>
        <Link to={routeBuilders.storeProducts(storeId)} className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-foreground hover:text-lime-hover">View catalog <ArrowUpRight size={14}/></Link>
      </div>
      {suggestions.isPending ? <div aria-busy="true" aria-label="Loading suggestions" className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[0,1,2].map(i => <div key={i} className="h-64 rounded-xl bg-soft motion-safe:animate-pulse"/>)}</div> : suggestions.isError ? <div className="flex items-center justify-between gap-3 rounded-xl bg-soft p-4"><p role="status" className="text-xs text-muted">Suggestions could not load. Your checkout is still available.</p><Button size="sm" variant="secondary" onClick={() => void suggestions.refetch()}>Retry</Button></div> : !suggestions.data.length ? <p className="rounded-xl bg-soft p-4 text-xs text-muted">No other available products to suggest right now. Browse the catalog for more options.</p> : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {suggestions.data.map(product => <Link key={product.id} to={routeBuilders.storeProduct(storeId, product.id)} className="group min-w-0 overflow-hidden rounded-xl border border-border bg-white p-2.5 transition-colors hover:border-lime-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg">
            <div className="overflow-hidden rounded-lg bg-soft/50"><PrivateImage path={product.imagePath} alt={product.name} className="h-28 w-full bg-transparent p-2 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105 sm:h-32"/></div>
            <p className="mt-3 truncate text-[10px] text-muted">{product.brandName ?? product.categoryName ?? "Wholesale catalog"}</p>
            <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5">{product.name}</h3>
            <p className="mt-1 truncate text-[11px] text-muted">{product.variant.name}{product.variant.packSize ? ` · ${product.variant.packSize}` : ""}</p>
            <p className="mt-2 text-base font-semibold">{product.variantCount > 1 && <span className="mr-1 text-[10px] font-normal text-muted">From</span>}{formatCurrency(product.variant.price)}<span className="ml-1 text-[10px] font-normal text-muted">/ {product.unit}</span></p>
            <p className="mt-1 flex items-center gap-1 text-[10px] text-muted"><Package size={11}/>MOQ: {product.variant.moq} {product.unit}</p>
            <span className="mt-3 flex min-h-9 items-center justify-between rounded-lg bg-lime/15 px-2 text-xs font-semibold group-hover:bg-lime">View product <ArrowUpRight size={14}/></span>
          </Link>)}
        </div>
      )}
    </section>
  );
}
