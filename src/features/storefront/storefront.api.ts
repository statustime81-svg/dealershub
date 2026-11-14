import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabase/client";
import { dealerStoreSchema, storefrontSchema, dealerProductPageSchema, dealerProductSchema, type DealerProductFilters } from "./storefront.schemas";
export async function getAuthorizedStores(signal?: AbortSignal) {
  let request = getSupabaseClient().rpc("get_dealer_stores");
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return z.array(dealerStoreSchema).parse(data);
}
export async function getDealerStore(storeId: string, signal?: AbortSignal) {
  z.string().uuid().parse(storeId);
  let request = getSupabaseClient().rpc("get_dealer_storefront", { p_store_id: storeId });
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return storefrontSchema.parse(data);
}
export async function getDealerProducts(input: DealerProductFilters, signal?: AbortSignal) {
  z.object({ storeId: z.string().uuid(), page: z.number().int().min(1).max(100000),
    search: z.string().max(200), categoryId: z.union([z.literal(""), z.string().uuid()]),
    brandId: z.union([z.literal(""), z.string().uuid()]), sort: z.enum(["newest", "price_low", "price_high"]),
  }).parse(input);
  let request = getSupabaseClient().rpc("get_dealer_products", {
    p_store_id: input.storeId, p_page: input.page, p_search: input.search,
    p_category_id: input.categoryId || null, p_brand_id: input.brandId || null, p_sort: input.sort,
  });
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return dealerProductPageSchema.parse(data);
}
export async function getDealerProduct(storeId: string, productId: string, signal?: AbortSignal) {
  z.string().uuid().parse(storeId); z.string().uuid().parse(productId);
  let request = getSupabaseClient().rpc("get_dealer_product", { p_store_id: storeId, p_product_id: productId });
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return dealerProductSchema.parse(data);
}
