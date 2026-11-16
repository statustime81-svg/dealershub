import { Outlet, useNavigate, useParams } from "react-router-dom";
import { BadgeCheck, Search, Store } from "lucide-react";
import { StoreMediaImage } from "@/features/stores/components/StorePreview";
import { useDealerStore } from "@/features/storefront/storefront.hooks";
import { routeBuilders } from "@/config/routes";
export default function StorefrontLayout() {
  const { storeId = "" } = useParams();
  const navigate = useNavigate();
  const store = useDealerStore(storeId);
  if (!store.data || store.isError) return null;
  const data = store.data;
  return <div><section aria-label="Store information" className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div className="flex min-w-0 items-center gap-3">
      {data.logoPath ? <StoreMediaImage bucket="business-logos" path={data.logoPath} alt={`${data.businessName} logo`} className="h-12 w-16 shrink-0 object-contain"/> : <Store size={32} className="shrink-0 text-lime-hover"/>}
      <div className="min-w-0 border-l border-border pl-3"><div className="flex items-center gap-2"><h1 className="truncate text-lg font-semibold tracking-tight">{data.businessName}</h1>{data.verified && <BadgeCheck size={16} className="shrink-0 text-success" aria-label="Verified supplier"/>}</div><p className="mt-1 text-xs text-muted">{data.businessType === "manufacturer" ? "Manufacturer" : "Distributor"} · {data.name}</p></div>
    </div>
    <form role="search" className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-border bg-white px-3 sm:w-[48%]" onSubmit={event => { event.preventDefault(); const search = String(new FormData(event.currentTarget).get("search") ?? "").trim().slice(0,200); navigate(`${routeBuilders.storeProducts(data.id)}${search ? `?search=${encodeURIComponent(search)}` : ""}`); }}><Search size={17} className="shrink-0 text-muted"/><input type="search" name="search" aria-label="Search this store's products" placeholder="Search products in this store…" maxLength={200} className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"/><button type="submit" className="text-xs font-medium text-foreground">Search</button></form>
  </section><Outlet/></div>;
}
