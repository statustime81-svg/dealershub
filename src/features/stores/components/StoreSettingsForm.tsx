import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { StoreMediaImage } from "./StorePreview";
import { uploadStoreMedia } from "../store-media.api";
import { storeSettingsSchema, type StoreWorkspaceData, type StoreSettingsValues } from "../stores.schemas";

export function StoreSettingsForm({ store, onSave, onLogoSave }: {
  store: StoreWorkspaceData;
  onSave: (values: StoreSettingsValues) => Promise<void>;
  onLogoSave: (path: string) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [logoMessage, setLogoMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StoreSettingsValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: { name: store.name, slug: store.slug, description: store.description ?? "", isPublished: store.is_published },
  });
  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Business logo</h2>
        <StoreMediaImage bucket="business-logos" path={store.business.logo_path}
          alt="Business logo" className="size-24" />
        <ImageUploader disabled={isSubmitting || uploading} onUpload={async (file) => {
          setUploading(true); setLogoMessage(null);
          try {
            const path = await uploadStoreMedia("business-logos", store.business_id, file);
            await onLogoSave(path); setLogoMessage("Business logo saved.");
          } finally { setUploading(false); }
        }} />
        {logoMessage && <p role="status" className="text-sm text-success">{logoMessage}</p>}
        <p className="text-xs leading-5 text-muted">Logo updates apply to this business and its stores.</p>
      </section>
      <form noValidate onSubmit={handleSubmit(onSave)} className="rounded-xl border border-border bg-surface p-5">
        <fieldset disabled={isSubmitting || uploading} className="space-y-4">
          <legend className="mb-4 text-lg font-semibold">Store details</legend>
          <Input {...register("name")} label="Store name" required error={errors.name?.message} />
          <Input {...register("slug")} label="Store URL name" required autoCapitalize="none"
            autoCorrect="off" spellCheck={false} error={errors.slug?.message} />
          <Textarea {...register("description")} label="Description" error={errors.description?.message} />
          <Checkbox {...register("isPublished")} label="Publish store for authorized dealers" />
          <p className="text-xs leading-5 text-muted">Unpublished stores cannot receive dealer purchases. Authorization is required even after publishing.</p>
        </fieldset>
        <Button type="submit" className="mt-5" disabled={uploading} isLoading={isSubmitting} loadingText="Saving…">Save store settings</Button>
      </form>
    </div>
  );
}
