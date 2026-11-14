import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Button } from "@/components/ui/Button";
import { StoreMediaImage } from "./StorePreview";
import { uploadStoreMedia } from "../store-media.api";

export function StoreCategoryImageField({storeId, categoryId, name, disabled = false}: {
  storeId: string; categoryId: string; name: string; disabled?: boolean;
}) {
  const {user} = useAuth();
  const cache = useQueryClient();
  const key = ["user", user?.id, "store-category-image", storeId, categoryId];
  const image = useQuery({queryKey: key, enabled: Boolean(user), queryFn: async () => {
    const {data, error} = await getSupabaseClient().rpc("get_store_category_image", {
      p_store_id: storeId, p_category_id: categoryId,
    });
    if (error) throw error;
    return z.object({imagePath: z.string().nullable()}).parse(data);
  }});
  const save = useMutation({mutationFn: async (file: File | null) => {
    if (!image.isSuccess || image.isFetching) throw new Error("Refresh category first.");
    const path = file ? await uploadStoreMedia("store-banners", storeId, file) : null;
    const {error} = await getSupabaseClient().rpc("set_store_category_image", {
      p_store_id: storeId, p_category_id: categoryId,
      p_expected_image_path: image.data.imagePath, p_image_path: path,
    });
    if (error) throw error;
  }, onSettled: async () => {
    await cache.invalidateQueries({queryKey: ["user", user?.id]});
  }});
  return <div className="mt-4 space-y-3 border-t border-border pt-3">
    <p className="text-xs text-muted">Category image for this store</p>
    {image.data?.imagePath && <StoreMediaImage bucket="store-banners" path={image.data.imagePath}
      alt={name} className="h-28 w-full rounded-lg bg-soft object-contain" />}
    {image.isPending && <p className="text-xs text-muted">Loading image…</p>}
    {image.isError && <div><p role="alert" className="text-sm text-danger">Category image could not load. Apply the included SQL migration first.</p>
      <Button variant="secondary" onClick={() => {void image.refetch();}}>Retry</Button></div>}
    <ImageUploader disabled={disabled || !image.isSuccess || image.isFetching || save.isPending}
      onUpload={async file => {await save.mutateAsync(file);}} />
    {image.data?.imagePath && <Button variant="secondary" disabled={disabled || image.isFetching || save.isPending}
      onClick={() => save.mutate(null)}>Remove image</Button>}
    {save.isError && <p role="alert" className="text-sm text-danger">Image could not be updated. Check the refreshed image before retrying.</p>}
    {save.isSuccess && <p role="status" className="text-sm text-success">Category image saved.</p>}
  </div>;
}
