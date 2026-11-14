import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { StoreWorkspace } from "./MyStorePage";
import { StoreBannerForm } from "../components/StoreBannerForm";
import { StoreMediaImage } from "../components/StorePreview";
import { useStoreBanners } from "../stores.hooks";
import { saveStoreBanner, setBannerActive } from "../stores.api";
import type { StoreBanner, StoreBannerValues, StoreWorkspaceData } from "../stores.schemas";

function BannerManager({ store }: { store: StoreWorkspaceData }) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const banners = useStoreBanners(store.id);
  const [editor, setEditor] = useState<"new" | StoreBanner | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const businessKey = ["user", user?.id, "business", store.business_id];
  const toggle = useMutation({
    mutationFn: (banner: StoreBanner) => setBannerActive(store.id, banner.id, !banner.is_active),
    onSuccess: async () => { await cache.invalidateQueries({ queryKey: businessKey }); },
  });
  async function save(id: string, values: StoreBannerValues, create: boolean) {
    setSaving(true); setMessage(null);
    try {
      await saveStoreBanner({ storeId: store.id, bannerId: id, values, create });
      await cache.invalidateQueries({ queryKey: businessKey });
      setEditor(null); setMessage("Banner saved.");
    } finally { setSaving(false); }
  }
  return <div className="space-y-5">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">Store banners</h2>
      <Button disabled={saving || toggle.isPending || editor !== null} onClick={() => { setEditor("new"); setMessage(null); }}>Add banner</Button>
    </div>
    {message && <p role="status" className="text-sm text-success">{message}</p>}
    {toggle.isError && <p role="alert" className="text-sm text-danger">Banner status could not be updated.</p>}
    {editor && <StoreBannerForm key={typeof editor === "string" ? editor : editor.id}
      storeId={store.id} banner={typeof editor === "string" ? undefined : editor}
      onSave={save} onCancel={() => setEditor(null)} />}
    {banners.isPending ? <Spinner label="Loading banners" /> : banners.isError ? (
      <div><p role="alert" className="text-sm text-danger">Banners could not load.</p>
        <Button variant="secondary" className="mt-3" onClick={() => { void banners.refetch(); }}>Try again</Button></div>
    ) : !banners.data.length ? <EmptyState title="No banners yet" description="Add a wide image to introduce your store." /> : (
      <div className="grid gap-4 xl:grid-cols-2">{banners.data.map((banner) => <article key={banner.id}
        className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <StoreMediaImage bucket="store-banners" path={banner.image_path}
          alt={banner.heading || "Store banner"} className="aspect-[3/1]" />
        <div className="flex items-start justify-between gap-3">
          <div><h3 className="font-semibold">{banner.heading || "Store banner"}</h3>
            <p className="mt-1 text-xs text-muted">Display order: {banner.sort_order}</p></div>
          <Badge variant={banner.is_active ? "success" : "neutral"}>{banner.is_active ? "Active" : "Inactive"}</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" disabled={editor !== null || toggle.isPending || saving}
            onClick={() => { setEditor(banner); setMessage(null); }}>Edit</Button>
          <Button size="sm" variant="secondary" disabled={editor !== null || toggle.isPending || saving}
            onClick={() => toggle.mutate(banner)}>{banner.is_active ? "Deactivate" : "Activate"}</Button>
        </div>
      </article>)}</div>
    )}
  </div>;
}
export default function StoreBannersPage() {
  return <StoreWorkspace title="Store banners">{(store) => <BannerManager key={store.id} store={store} />}</StoreWorkspace>;
}
