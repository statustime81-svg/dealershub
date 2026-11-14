import { StoreMediaImage } from "@/features/stores/components/StorePreview";
import { Link } from "react-router-dom";
import { Boxes } from "lucide-react";
import { routeBuilders } from "@/config/routes";
import type { DealerStorefront } from "../storefront.schemas";
export function CategoryGrid({ store }: { store: DealerStorefront }) {
  if (!store.categories.length) return null;
  return <section className="space-y-4"><h2 className="text-xl font-bold">Shop by category</h2>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {store.categories.map((category) => <Link key={category.id} to={routeBuilders.storeCategory(store.id, category.id)}
        className="rounded-xl border border-border bg-surface p-5 hover:border-lime-hover">
        {category.imagePath ? <StoreMediaImage bucket="store-banners" path={category.imagePath} alt={category.name} className="h-20 w-full object-contain"/> : <Boxes size={24} className="text-muted" aria-hidden="true" />}
        <h3 className="mt-3 text-sm font-semibold">{category.name}</h3>
        {category.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{category.description}</p>}
      </Link>)}
    </div>
  </section>;
}
