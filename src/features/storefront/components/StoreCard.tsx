import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { StoreMediaImage } from "@/features/stores/components/StorePreview";
import { routeBuilders } from "@/config/routes";
import type { DealerStore } from "../storefront.schemas";
export function StoreCard({ store }: { store: DealerStore }) {
  return <article className="flex flex-col rounded-xl border border-border bg-surface p-5">
    <StoreMediaImage bucket="business-logos" path={store.logoPath} alt={`${store.businessName} logo`} className="size-16" />
    <h2 className="mt-4 flex items-center gap-2 text-lg font-semibold">{store.name}
      {store.verified && <ShieldCheck size={17} aria-label="Verified business" className="text-success" />}</h2>
    <p className="mt-1 text-xs text-muted">{store.businessName}</p>
    {store.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{store.description}</p>}
    <Link to={routeBuilders.store(store.id)} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-lime px-4 text-sm font-semibold text-midnight hover:bg-lime-hover">
      Open store<ArrowRight size={16} aria-hidden="true" />
    </Link>
  </article>;
}
