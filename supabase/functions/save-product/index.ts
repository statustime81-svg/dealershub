import { handlePreflight } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";

import {
  requireBusinessAdmin,
} from "../_shared/permissions.ts";

import {
  createAdminClient,
} from "../_shared/supabase-admin.ts";

import {
  errorResponse,
  HttpError,
  jsonResponse,
  requirePost,
} from "../_shared/responses.ts";

import {
  parseBody,
  uuidSchema,
  z,
} from "../_shared/validation.ts";

const integer = z
  .number()
  .int()
  .max(2147483647);

const variantSchema = z.object({
  id: uuidSchema,

  name: z.string().trim().min(1).max(150),
  sku: z.string().trim().max(100),

  wholesalePrice: z
    .number()
    .finite()
    .min(0)
    .max(999999999999.99)
    .refine(
      (value) =>
        Math.abs(
          value * 100 - Math.round(value * 100),
        ) < 0.01,
      "Use no more than two decimal places.",
    ),

  moq: integer.positive(),
  quantityStep: integer.positive(),

  packSize: z.string().trim().max(100),

  unitsPerPack: integer.positive().nullable(),
  stockQuantity: integer.min(0).nullable(),

  availability: z.enum([
    "in_stock",
    "low_stock",
    "out_of_stock",
    "enquire",
  ]),

  isActive: z.boolean(),
}).strict();

const schema = z.object({
  businessId: uuidSchema,
  storeId: uuidSchema,
  productId: uuidSchema,

  create: z.boolean(),

  product: z.object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(10000),

    categoryId: uuidSchema,

    brandId: z.union([
      z.literal(""),
      uuidSchema,
    ]),

    unit: z.string().trim().min(1).max(50),

    packagingDetails: z
      .string()
      .trim()
      .max(2000),

    isActive: z.boolean(),
  }).strict(),

  variants: z.array(variantSchema).min(1),
}).strict();

Deno.serve(async (request) => {
  const preflight = handlePreflight(request);

  if (preflight) {
    return preflight;
  }

  try {
    requirePost(request);

    const admin = createAdminClient();
    const user = await requireUser(request, admin);
    const input = await parseBody(request, schema);

    await requireBusinessAdmin(
      admin,
      user.id,
      input.businessId,
    );

    const ids = input.variants.map(
      (variant) => variant.id,
    );

    if (new Set(ids).size !== ids.length) {
      throw new HttpError(
        400,
        "Each variant must have a unique ID.",
      );
    }

    const { data, error } = await admin.rpc(
      "save_catalog_product",
      {
        p_actor_id: user.id,
        p_business_id: input.businessId,
        p_store_id: input.storeId,
        p_product_id: input.productId,
        p_create: input.create,
        p_product: input.product,
        p_variants: input.variants,
      },
    );

    if (error) {
      throw new HttpError(
        409,
        "Product could not be saved. Check category, brand, SKU uniqueness and product access.",
      );
    }

    return jsonResponse({
      success: true,
      productId: data,
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
});