import { z } from "zod";

const integer = z
  .number()
  .int()
  .max(2147483647);

export const editorVariantSchema = z.object({
  variantId: z.string().uuid(),

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
});

export const catalogEditorSchema = z.object({
  name: z.string().trim().min(
    1,
    "Enter the product name.",
  ).max(200),

  description: z.string().trim().max(10000),

  categoryId: z.string().uuid(
    "Select a category.",
  ),

  brandId: z.union([
    z.literal(""),
    z.string().uuid(),
  ]),

  unit: z.string().trim().min(
    1,
    "Enter the selling unit.",
  ).max(50),

  packagingDetails: z.string().trim().max(2000),

  isActive: z.boolean(),

  variants: z.array(editorVariantSchema).min(
    1,
    "At least one variant is required.",
  ),
});

export const taxonomyOptionsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
);

export const saveProductResponseSchema = z.object({
  success: z.literal(true),
  productId: z.string().uuid(),
});

export type CatalogEditorValues = z.infer<
  typeof catalogEditorSchema
>;

export function createDefaultVariant():
  CatalogEditorValues["variants"][number] {
  return {
    variantId: crypto.randomUUID(),
    name: "Default",
    sku: "",
    wholesalePrice: 0,
    moq: 1,
    quantityStep: 1,
    packSize: "",
    unitsPerPack: null,
    stockQuantity: null,
    availability: "in_stock",
    isActive: true,
  };
}

export function createDefaultProduct():
  CatalogEditorValues {
  return {
    name: "",
    description: "",
    categoryId: "",
    brandId: "",
    unit: "",
    packagingDetails: "",
    isActive: true,
    variants: [createDefaultVariant()],
  };
}