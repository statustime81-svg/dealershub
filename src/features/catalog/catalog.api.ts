import { z } from "zod";

import { getSupabaseClient } from "@/lib/supabase/client";

import {
  productListSchema,
  storeOptionsSchema,
} from "./catalog.schemas";

export type ProductStatusFilter =
  | "all"
  | "active"
  | "inactive";

export interface ProductListInput {
  storeId: string;
  search: string;
  status: ProductStatusFilter;
  page: number;
  categoryId?: string;
  brandId?: string;
}

export const PRODUCT_PAGE_SIZE = 12;

function escapeLike(value: string): string {
  return value.replace(
    /[\\%_]/g,
    (character) => `\\${character}`,
  );
}

export async function getCatalogStores(
  businessId: string,
  signal?: AbortSignal,
) {
  z.string().uuid().parse(businessId);

  const supabase = getSupabaseClient();

  let request = supabase
    .from("stores")
    .select("id, name")
    .eq("business_id", businessId)
    .order("created_at")
    .order("id");

  if (signal) {
    request = request.abortSignal(signal);
  }

  const { data, error } = await request;

  if (error) {
    throw error;
  }

  return storeOptionsSchema.parse(data ?? []);
}

export async function getProducts(
  input: ProductListInput,
  signal?: AbortSignal,
) {
  z.string().uuid().parse(input.storeId);
  z.number().int().positive().parse(input.page);

  const supabase = getSupabaseClient();

  const start =
    (input.page - 1) * PRODUCT_PAGE_SIZE;

  let request = supabase
    .from("products")
    .select(
      `
        id,
        store_id,
        name,
        unit,
        is_active,
        created_at,
        category:product_categories!products_category_id_fkey(name),
        brand:brands!products_brand_id_fkey(name),
        images:product_images(
          image_path,
          alt_text,
          sort_order
        ),
        variants:product_variants(
          id,
          sku,
          wholesale_price,
          moq,
          stock_quantity,
          is_active
        )
      `,
      { count: "exact" },
    )
    .eq("store_id", input.storeId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(
      start,
      start + PRODUCT_PAGE_SIZE - 1,
    );

  if (input.search.trim()) {
    request = request.ilike(
      "name",
      `%${escapeLike(input.search.trim())}%`,
    );
  }

  if (input.status !== "all") {
    request = request.eq(
      "is_active",
      input.status === "active",
    );
  }

  if (input.categoryId) {
    z.string().uuid().parse(input.categoryId);

    request = request.eq(
      "category_id",
      input.categoryId,
    );
  }

  if (input.brandId) {
    z.string().uuid().parse(input.brandId);

    request = request.eq(
      "brand_id",
      input.brandId,
    );
  }

  if (signal) {
    request = request.abortSignal(signal);
  }

  const { data, error, count } = await request;

  if (error) {
    throw error;
  }

  return {
    items: productListSchema.parse(data ?? []),
    total: count ?? 0,
  };
}

export async function setProductActive(input: {
  storeId: string;
  productId: string;
  isActive: boolean;
}) {
  z.object({
    storeId: z.string().uuid(),
    productId: z.string().uuid(),
    isActive: z.boolean(),
  }).parse(input);

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .update({
      is_active: input.isActive,
    })
    .eq("store_id", input.storeId)
    .eq("id", input.productId)
    .select("id, is_active")
    .single();

  if (error) {
    throw error;
  }

  return z.object({
    id: z.string().uuid(),
    is_active: z.boolean(),
  }).parse(data);
}