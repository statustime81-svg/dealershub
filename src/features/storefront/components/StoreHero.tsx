import { useState } from "react";
import { Link } from "react-router-dom";
import { StoreMediaImage } from "@/features/stores/components/StorePreview";
import { routeBuilders } from "@/config/routes";
import type { DealerStorefront } from "../storefront.schemas";
export function StoreHero({ store }: { store: DealerStorefront }) {
  const [selected, setSelected] = useState(0);
  const index = selected < store.banners.length ? selected : 0;
  const banner = store.banners[index];
  return <section className="overflow-hidden rounded-xl border border-border bg-surface">
    {banner && <StoreMediaImage bucket="store-banners" path={banner.imagePath} alt={banner.heading || `${store.name} banner`} className="aspect-[3/1]" />}
    <div className="p-5 sm:p-7">
      <h2 className="max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">{banner?.heading || store.name}</h2>
      {(banner?.description || store.description) && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{banner?.description || store.description}</p>}
      <Link to={routeBuilders.storeProducts(store.id)} className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-lime px-5 text-sm font-semibold text-midnight hover:bg-lime-hover">Explore products</Link>
      {store.banners.length > 1 && <div className="mt-4 flex flex-wrap gap-2" aria-label="Choose store banner">
        {store.banners.map((item, i) => <button key={item.id} type="button" aria-label={`Show banner ${i + 1}`} aria-pressed={index === i}
          onClick={() => setSelected(i)} className={`flex size-11 items-center justify-center rounded-lg border text-xs ${index === i ? "border-midnight bg-midnight text-white" : "border-border"}`}>{i + 1}</button>)}
      </div>}
    </div>
  </section>;
}
