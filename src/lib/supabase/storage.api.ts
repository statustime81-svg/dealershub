import { z } from "zod";

import { getSupabaseClient } from "./client";

export const MAX_PRODUCT_IMAGE_BYTES =
  10 * 1024 * 1024;

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadProductImage(
  storeId: string,
  productId: string,
  file: File,
): Promise<string> {
  z.string().uuid().parse(storeId);
  z.string().uuid().parse(productId);

  const extension = extensions[file.type];

  if (!extension) {
    throw new Error(
      "Choose a JPEG, PNG or WebP image.",
    );
  }

  if (
    file.size === 0 ||
    file.size > MAX_PRODUCT_IMAGE_BYTES
  ) {
    throw new Error(
      "Choose an image smaller than 10 MB.",
    );
  }

  // Confirm that the browser can decode the image.
  const bitmap = await createImageBitmap(file);
  bitmap.close();

  const path =
    `${storeId}/${productId}/${crypto.randomUUID()}.${extension}`;

  const supabase = getSupabaseClient();

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
      cacheControl: "300",
    });

  if (error) {
    throw error;
  }

  return path;
}

export async function getProductImageUrl(
  path: string,
): Promise<string> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from("product-images")
    .createSignedUrl(path, 300);

  if (error || !data?.signedUrl) {
    throw error ?? new Error(
      "Image preview is unavailable.",
    );
  }

  return data.signedUrl;
}