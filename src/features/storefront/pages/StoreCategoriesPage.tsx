import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Boxes } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { StoreMediaImage } from "@/features/stores/components/StorePreview";
import { routeBuilders } from "@/config/routes";
import { useDealerStore } from "../storefront.hooks";

export default function StoreCategoriesPage() {
  const { storeId = "" } = useParams();
  const store = useDealerStore(storeId);
  const [search, setSearch] = useState("");
  if (store.isPending) return <Spinner label="Loading categories" />;
  if (store.isError || !store.data) return (
    <div className="ds-state">
      <p role="alert">Categories could not load.</p>
      <Button variant="secondary" className="mt-4" onClick={() => { void store.refetch(); }}>Try again</Button>
    </div>
  );
  const categories = store.data.categories.filter(category =>
    category.name.toLowerCase().includes(search.trim().toLowerCase()));
  return (
    <section className="space-y-6 py-6">
      <Link to={routeBuilders.store(storeId)} className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={16} aria-hidden="true" /> Back to store
      </Link>
      <div className="ds-section-title"><div>
        <p className="ds-eyebrow">EXPLORE YOUR SUPPLIER</p>
        <h1 className="text-3xl font-semibold tracking-tight">All categories</h1>
        <p className="ds-section-description">Browse categories from {store.data.name}.</p>
      </div></div>
      <div className="max-w-md">
        <SearchInput label="Search categories" placeholder="Search categories…" value={search} maxLength={150}
          onChange={event => setSearch(event.target.value)} />
      </div>
      <p className="text-sm text-muted" aria-live="polite">{categories.length} {categories.length === 1 ? "category" : "categories"}</p>
      {categories.length ? (
        <div className="ds-category-grid">
          {categories.map((category, index) => (
            <Link key={category.id} to={routeBuilders.storeCategory(storeId, category.id)} className="ds-category-tile">
              <span className={`ds-category-art ds-category-color-${index % 3}`}>
                {category.imagePath ? <StoreMediaImage bucket="store-banners" path={category.imagePath} alt={category.name}
                  className="h-full w-full object-contain" /> : <Boxes size={30} strokeWidth={1.35} aria-hidden="true" />}
              </span>
              <div><strong>{category.name}</strong><small>{category.description || "Explore the collection"}</small></div>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          ))}
        </div>
      ) : <EmptyState title="No categories found" description={search.trim()
          ? "Try another category name." : "Your supplier has not added categories to this store yet."} />}
    </section>
  );
}
