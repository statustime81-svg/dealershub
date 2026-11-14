import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ImageOff, ShieldCheck, Store } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import { getStoreMediaUrl, type StoreMediaBucket } from "../store-media.api";
import { useStoreBanners, useStoreTaxonomy } from "../stores.hooks";
import type { StoreWorkspaceData } from "../stores.schemas";

export function StoreMediaImage({ bucket, path, alt, className }: {
  bucket: StoreMediaBucket; path: string | null; alt: string; className?: string;
}) {
  const { user } = useAuth();
  const image = useQuery({
    queryKey: ["user", user?.id, "signed-store-media", bucket, path],
    enabled: Boolean(user && path),
    queryFn: () => {
      if (!path) throw new Error("Image path required.");
      return getStoreMediaUrl(bucket, path);
    },
    staleTime: 240000, gcTime: 300000, refetchInterval: 240000,
  });
  return (
    <div className={cn("flex items-center justify-center overflow-hidden rounded-lg bg-soft", className)}>
      {image.data ? <img src={image.data} alt={alt} className="h-full w-full object-contain" />
        : <ImageOff size={24} aria-hidden="true" className="text-muted" />}
      {image.isError && <span className="sr-only">Image unavailable</span>}
    </div>
  );
}

export function StorePreview({ store }: { store: StoreWorkspaceData }) {
  const banners = useStoreBanners(store.id);
  const categories = useStoreTaxonomy(store.id, "categories");
  const activeBanners = banners.data?.filter((banner) => banner.is_active) ?? [];
  const assigned = categories.data?.items.filter((item) =>
    categories.data?.assignedIds.includes(item.id)) ?? [];
  const query = `?storeId=${encodeURIComponent(store.id)}`;
  return (
    <section className="space-y-5 rounded-xl border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <StoreMediaImage bucket="business-logos" path={store.business.logo_path}
            alt={`${store.business.company_name} logo`} className="size-14 shrink-0" />
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              {store.name}
              {store.business.verification_status === "verified" &&
                <ShieldCheck size={18} className="text-success" aria-label="Verified business" />}
            </h2>
            <p className="mt-1 text-xs text-muted">{store.business.company_name}</p>
          </div>
        </div>
        <Badge variant={store.is_published ? "success" : "neutral"}>
          {store.is_published ? "Published · authorized access only" : "Unpublished"}
        </Badge>
      </div>
      {store.description && <p className="text-sm leading-6 text-muted">{store.description}</p>}
      {banners.isPending ? <Spinner label="Loading store banners" /> : banners.isError ? (
        <div><p role="alert" className="text-sm text-danger">Banners could not load.</p>
          <Button variant="secondary" className="mt-2" onClick={() => { void banners.refetch(); }}>Try again</Button></div>
      ) : activeBanners.length ? (
        <div className="space-y-4">{activeBanners.map((banner) => (
          <article key={banner.id} className="overflow-hidden rounded-xl border border-border">
            <StoreMediaImage bucket="store-banners" path={banner.image_path}
              alt={banner.heading || "Store banner"} className="aspect-[3/1]" />
            {(banner.heading || banner.description) && <div className="p-4">
              {banner.heading && <h3 className="text-lg font-semibold">{banner.heading}</h3>}
              {banner.description && <p className="mt-2 text-sm leading-6 text-muted">{banner.description}</p>}
            </div>}
          </article>
        ))}</div>
      ) : <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <Store className="mx-auto text-muted" aria-hidden="true" />
        <p className="mt-3 text-sm text-muted">No active store banners.</p>
        <Link className="mt-3 inline-flex min-h-11 items-center text-sm text-info" to={`${routes.manufacturer.store}/banners${query}`}>Manage banners</Link>
      </div>}
      <section>
        <h3 className="text-lg font-semibold">Store categories</h3>
        {categories.isPending ? <Spinner label="Loading store categories" /> : categories.isError ? (
          <div><p role="alert" className="mt-2 text-sm text-danger">Categories could not load.</p>
            <Button variant="secondary" className="mt-2" onClick={() => { void categories.refetch(); }}>Try again</Button></div>
        ) : assigned.length ? <div className="mt-3 grid gap-3 sm:grid-cols-3">{assigned.map((item) => (
          <div key={item.id} className="rounded-lg border border-border p-4 text-sm font-medium">{item.name}</div>
        ))}</div> : <p className="mt-2 text-sm text-muted">No active categories enabled yet.</p>}
      </section>
      <p className="border-t border-border pt-4 text-xs leading-5 text-muted">
        Manufacturer preview. Publishing does not make this store public; dealers still need active authorization.
      </p>
    </section>
  );
}
