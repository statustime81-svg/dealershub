import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabase/client";
export type StoreMediaBucket = "business-logos" | "store-banners";
const extensions: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
};
export async function uploadStoreMedia(
  bucket: StoreMediaBucket, ownerId: string, file: File,
): Promise<string> {
  z.string().uuid().parse(ownerId);
  const extension = extensions[file.type];
  if (!extension || file.size === 0 || file.size > 10 * 1024 * 1024) {
    throw new Error("Choose JPEG, PNG or WebP under 10 MB.");
  }
  const bitmap = await createImageBitmap(file);
  bitmap.close();
  const path = `${ownerId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await getSupabaseClient().storage.from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false, cacheControl: "300" });
  if (error) throw error;
  return path;
}
export async function getStoreMediaUrl(bucket: StoreMediaBucket, path: string) {
  const { data, error } = await getSupabaseClient().storage.from(bucket)
    .createSignedUrl(path, 300);
  if (error || !data?.signedUrl) throw error ?? new Error("Image unavailable.");
  return data.signedUrl;
}
