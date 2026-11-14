import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { StoreMediaImage } from "./StorePreview";
import { uploadStoreMedia } from "../store-media.api";
import { storeBannerFormSchema, type StoreBanner, type StoreBannerValues } from "../stores.schemas";

export function StoreBannerForm({ storeId, banner, onSave, onCancel }: {
  storeId: string; banner?: StoreBanner;
  onSave: (id: string, values: StoreBannerValues, create: boolean) => Promise<void>;
  onCancel: () => void;
}) {
  const [newId] = useState(() => crypto.randomUUID());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<StoreBannerValues>({
    resolver: zodResolver(storeBannerFormSchema),
    defaultValues: {
      imagePath: banner?.image_path ?? "", heading: banner?.heading ?? "",
      description: banner?.description ?? "", sortOrder: banner?.sort_order ?? 0,
      isActive: banner?.is_active ?? true,
    },
  });
  const path = watch("imagePath");
  return (
    <form noValidate className="space-y-4 rounded-xl border border-border bg-surface p-5"
      onSubmit={handleSubmit(async (values) => {
        setError(null);
        try { await onSave(banner?.id ?? newId, values, !banner); }
        catch { setError("Banner could not be saved. After a timeout, refresh the list before creating another."); }
      })}>
      <h2 className="text-lg font-semibold">{banner ? "Edit banner" : "Add banner"}</h2>
      <input type="hidden" {...register("imagePath")} />
      {path && <StoreMediaImage bucket="store-banners" path={path} alt="Banner preview" className="aspect-[3/1]" />}
      <ImageUploader disabled={isSubmitting || uploading} onUpload={async (file) => {
        setUploading(true);
        try {
          const uploaded = await uploadStoreMedia("store-banners", storeId, file);
          setValue("imagePath", uploaded, { shouldDirty: true, shouldValidate: true });
        } finally { setUploading(false); }
      }} />
      {errors.imagePath && <p role="alert" className="text-sm text-danger">{errors.imagePath.message}</p>}
      <fieldset disabled={isSubmitting || uploading} className="space-y-4">
        <Input {...register("heading")} label="Heading" error={errors.heading?.message} />
        <Textarea {...register("description")} label="Supporting text" error={errors.description?.message} />
        <Input {...register("sortOrder", { valueAsNumber: true })} type="number" min="0" step="1"
          label="Display order" hint="Lower numbers appear first." error={errors.sortOrder?.message} />
        <Checkbox {...register("isActive")} label="Banner active" />
      </fieldset>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={uploading} isLoading={isSubmitting} loadingText="Saving…">Save banner</Button>
        <Button variant="secondary" disabled={isSubmitting || uploading} onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
