import { ShieldCheck } from "lucide-react";
import { StoreMediaImage } from "@/features/stores/components/StorePreview";
import type { DealerStore } from "@/features/storefront/storefront.schemas";
export function StoreHeader({ store }: { store: DealerStore }) {
  return <section className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
    <StoreMediaImage bucket="business-logos" path={store.logoPath} alt={`${store.businessName} logo`} className="size-14 shrink-0" />
    <div className="min-w-0"><h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
      {store.name}{store.verified && <ShieldCheck size={18} className="shrink-0 text-success" aria-label="Verified business" />}
    </h1><p className="mt-1 text-xs text-muted">{store.businessName} · {store.businessType === "manufacturer" ? "Manufacturer" : "Distributor"}</p></div>
  </section>;
}
