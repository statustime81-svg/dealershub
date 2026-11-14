import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10000),
  categoryId: z.string().uuid(),

  brandId: z.union([
    z.literal(""),
    z.string().uuid(),
  ]),

  unit: z.string().trim().min(1).max(50),
  packagingDetails: z.string().trim().max(2000),
  isActive: z.boolean(),
});

export const productVariantFormSchema = z.object({
  name: z.string().trim().min(1).max(150),
  sku: z.string().trim().max(100),

  wholesalePrice: z.number().finite().min(0),
  moq: z.number().int().positive(),
  quantityStep: z.number().int().positive(),

  packSize: z.string().trim().max(100),

  unitsPerPack: z.number().int().positive().nullable(),
  stockQuantity: z.number().int().min(0).nullable(),

  availability: z.enum([
    "in_stock",
    "low_stock",
    "out_of_stock",
    "enquire",
  ]),

  isActive: z.boolean(),
});

export const storeOptionsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
);

export const productListRowSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),

  name: z.string(),
  unit: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),

  category: z.object({
    name: z.string(),
  }).nullable(),

  brand: z.object({
    name: z.string(),
  }).nullable(),

  images: z.array(
    z.object({
      image_path: z.string(),
      alt_text: z.string().nullable(),
      sort_order: z.number(),
    }),
  ),

  variants: z.array(
    z.object({
      id: z.string().uuid(),
      sku: z.string().nullable(),
      wholesale_price: z.number(),
      moq: z.number(),
      stock_quantity: z.number().nullable(),
      is_active: z.boolean(),
    }),
  ),
});

export const productListSchema =
  z.array(productListRowSchema);

export type ProductListRow =
  z.infer<typeof productListRowSchema>;

export type ProductFormValues =
  z.infer<typeof productFormSchema>;

export type ProductVariantFormValues =
  z.infer<typeof productVariantFormSchema>;