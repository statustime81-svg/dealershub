import { z } from "zod";

import {
  getSupabaseClient,
} from "@/lib/supabase/client";

import {
  invokeAuthenticatedFunction,
} from "@/lib/supabase/function-client";

import {
  catalogEditorSchema,
  saveProductResponseSchema,
  taxonomyOptionsSchema,
  type CatalogEditorValues,
} from "./catalog-editor.schemas";

export async function getEditorOptions(
  signal?: AbortSignal,
  businessId?: string,
) {
  const supabase = getSupabaseClient();

  if (businessId) z.string().uuid().parse(businessId);
  const categoriesRequest = supabase
    .from("product_categories")
    .select("id, name")
    .or(businessId ? `owner_business_id.is.null,owner_business_id.eq.${businessId}` : "owner_business_id.is.null")
    .eq("is_active", true)
    .order("name");

  const brandsRequest = supabase
    .from("brands")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  const [categories, brands] = await Promise.all([
    signal
      ? categoriesRequest.abortSignal(signal)
      : categoriesRequest,

    signal
      ? brandsRequest.abortSignal(signal)
      : brandsRequest,
  ]);

  if (categories.error) {
    throw categories.error;
  }

  if (brands.error) {
    throw brands.error;
  }

  return {
    categories: taxonomyOptionsSchema.parse(
      categories.data ?? [],
    ),

    brands: taxonomyOptionsSchema.parse(
      brands.data ?? [],
    ),
  };
}

export async function getEditorProduct(
  storeId: string,
  productId: string,
  signal?: AbortSignal,
): Promise<CatalogEditorValues> {
  const supabase = getSupabaseClient();

  let request = supabase
    .from("products")
    .select(`
      name,
      description,
      category_id,
      brand_id,
      unit,
      packaging_details,
      is_active,
      variants:product_variants(
        id,
        name,
        sku,
        wholesale_price,
        moq,
        quantity_step,
        pack_size,
        units_per_pack,
        stock_quantity,
        availability,
        is_active
      )
    `)
    .eq("store_id", storeId)
    .eq("id", productId);

  if (signal) {
    request = request.abortSignal(signal);
  }

  const { data, error } = await request.single();

  if (error) {
    throw error;
  }

  const raw = z.object({
    name: z.string(),
    description: z.string().nullable(),
    category_id: z.string().uuid(),
    brand_id: z.string().uuid().nullable(),
    unit: z.string(),
    packaging_details: z.string().nullable(),
    is_active: z.boolean(),

    variants: z.array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        sku: z.string().nullable(),
        wholesale_price: z.number(),
        moq: z.number(),
        quantity_step: z.number(),
        pack_size: z.string().nullable(),
        units_per_pack: z.number().nullable(),
        stock_quantity: z.number().nullable(),
        availability: z.string(),
        is_active: z.boolean(),
      }),
    ),
  }).parse(data);

  return catalogEditorSchema.parse({
    name: raw.name,
    description: raw.description ?? "",
    categoryId: raw.category_id,
    brandId: raw.brand_id ?? "",
    unit: raw.unit,
    packagingDetails:
      raw.packaging_details ?? "",
    isActive: raw.is_active,

    variants: raw.variants.map((variant) => ({
      variantId: variant.id,
      name: variant.name,
      sku: variant.sku ?? "",
      wholesalePrice: variant.wholesale_price,
      moq: variant.moq,
      quantityStep: variant.quantity_step,
      packSize: variant.pack_size ?? "",
      unitsPerPack: variant.units_per_pack,
      stockQuantity: variant.stock_quantity,
      availability: variant.availability,
      isActive: variant.is_active,
    })),
  });
}

export interface SaveProductInput {
  businessId: string;
  storeId: string;
  productId: string;
  create: boolean;
  values: CatalogEditorValues;
}

export async function saveEditorProduct(
  input: SaveProductInput,
) {
  const values = catalogEditorSchema.parse(
    input.values,
  );

  const { variants, ...product } = values;

  const response =
    await invokeAuthenticatedFunction<unknown>(
      "save-product",
      {
        businessId: input.businessId,
        storeId: input.storeId,
        productId: input.productId,
        create: input.create,
        product,

        variants: variants.map(
          ({ variantId, ...variant }) => ({
            ...variant,
            id: variantId,
          }),
        ),
      },
    );

  return saveProductResponseSchema.parse(response);
}