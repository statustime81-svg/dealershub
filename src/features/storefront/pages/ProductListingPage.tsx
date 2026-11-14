import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { routeBuilders } from "@/config/routes";
import { useDebounce } from "@/hooks/useDebounce";
import { useDealerStore, useDealerProducts } from "../storefront.hooks";
import type { DealerStorefront, ProductSort } from "../storefront.schemas";
import { ProductGrid } from "../components/ProductGrid";
function StoreCatalog({ store, fixedCategory, initialSearch }: { store: DealerStorefront; fixedCategory: string; initialSearch: string }) {
  const [filters, setFilters] = useState<{ search: string; categoryId: string; brandId: string; sort: ProductSort }>({
    search: initialSearch, categoryId: fixedCategory, brandId: "", sort: "newest",
  });
  const debounced = useDebounce(filters);
  const key = JSON.stringify(debounced);
  const [pagination, setPagination] = useState({ key: "", page: 1 });
  const page = pagination.key === key ? pagination.page : 1;
  const products = useDealerProducts({ storeId: store.id, page, ...debounced });
  const pages = Math.max(1, Math.ceil((products.data?.total ?? 0) / (products.data?.pageSize ?? 12)));
  const category = store.categories.find((item) => item.id === fixedCategory);
  function go(next: number) { setPagination({ key, page: Math.max(1, Math.min(pages, next)) }); }
  return <section className="space-y-5">
    <div><p className="text-xs text-muted"><Link to={routeBuilders.store(store.id)} className="hover:underline">Store</Link> / {category?.name ?? "All products"}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">{category?.name ?? "All products"}</h2>
      {category?.description && <p className="mt-2 text-sm text-muted">{category.description}</p>}
    </div>
    <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="space-y-4 rounded-xl border border-border bg-surface p-4" aria-label="Product filters">
        <h3 className="text-sm font-semibold">Filters</h3>
        <Select label="Category" value={filters.categoryId} disabled={Boolean(fixedCategory)}
          onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value }))}>
          <option value="">All categories</option>{store.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
        <Select label="Brand" value={filters.brandId}
          onChange={(event) => setFilters((current) => ({ ...current, brandId: event.target.value }))}>
          <option value="">All brands</option>{store.brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
        <Button variant="secondary" className="w-full" onClick={() => setFilters({ search: "", categoryId: fixedCategory, brandId: "", sort: "newest" })}>Reset filters</Button>
      </aside>
      <div className="min-w-0 space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_190px]">
          <SearchInput label="Search store products" placeholder="Search products…" maxLength={200} value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
          <Select aria-label="Sort products" value={filters.sort} onChange={(event) => {
            const sort = event.target.value;
            if (sort === "newest" || sort === "price_low" || sort === "price_high") setFilters((current) => ({ ...current, sort }));
          }}>
            <option value="newest">Newest first</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option>
          </Select>
        </div>
        {products.isPending ? <Spinner label="Loading catalog" /> : products.isError ? (
          <div><p role="alert" className="text-sm text-danger">Products could not load. Check your connection or store access.</p>
            <Button className="mt-3" variant="secondary" onClick={() => { void products.refetch(); }}>Try again</Button></div>
        ) : <>
          <p className="text-xs text-muted" aria-live="polite">{products.data.total} products</p>
          <ProductGrid products={products.data.items} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">Page {page} of {pages}</p><div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1 || products.isFetching} onClick={() => go(page - 1)}>Previous</Button>
              <Button size="sm" variant="secondary" disabled={page >= pages || products.isFetching} onClick={() => go(page + 1)}>Next</Button>
            </div>
          </div>
        </>}
      </div>
    </div>
  </section>;
}
export default function ProductListingPage() {
  const { storeId = "", categoryId = "" } = useParams();
  const [params] = useSearchParams();
  const initialSearch = (params.get("search") ?? "").trim().slice(0, 200);
  const store = useDealerStore(storeId);
  if (!store.data) return null;
  if (categoryId && (!z.string().uuid().safeParse(categoryId).success || !store.data.categories.some((item) => item.id === categoryId))) {
    return <EmptyState title="Category unavailable" description="Choose a category from this store." />;
  }
  return <StoreCatalog key={`${storeId}:${categoryId}:${initialSearch}`} store={store.data} fixedCategory={categoryId} initialSearch={initialSearch} />;
}
