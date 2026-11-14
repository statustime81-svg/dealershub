import { z } from "zod";

import { getSupabaseClient } from "@/lib/supabase/client";

import { invokeAuthenticatedFunction } from "@/lib/supabase/function-client";

const imageSchema = z.object({
  id: z.string().uuid(),
  image_path: z.string(),
  alt_text: z.string().nullable(),
  sort_order: z.number().int(),
});

export interface GalleryImage {
  id: string;
  imagePath: string;
  altText: string;
}

export async function getProductImages(
  productId: string,
  signal?: AbortSignal,
): Promise<GalleryImage[]> {
  const supabase = getSupabaseClient();

  let request = supabase
    .from("product_images")
    .select(
      "id, image_path, alt_text, sort_order",
    )
    .eq("product_id", productId)
    .order("sort_order")
    .order("id");

  if (signal) {
    request = request.abortSignal(signal);
  }

  const { data, error } = await request;

  if (error) {
    throw error;
  }

  return z.array(imageSchema)
    .parse(data ?? [])
    .map((image) => ({
      id: image.id,
      imagePath: image.image_path,
      altText: image.alt_text ?? "",
    }));
}

export async function saveProductImages(
  productId: string,
  expectedImages: GalleryImage[],
  images: GalleryImage[],
): Promise<void> {
  const response =
    await invokeAuthenticatedFunction<unknown>(
      "save-product-images",
      {
        productId,
        expectedImages,
        images,
      },
    );

  z.object({
    success: z.literal(true),
  }).parse(response);
}