import { z } from "zod";
const nullableText = z.string().nullable();
export const dealerStoreSchema = z.object({
  id: z.string().uuid(), name: z.string(), description: nullableText,
  businessName: z.string(), logoPath: nullableText,
  businessType: z.enum(["manufacturer", "distributor"]), verified: z.boolean(),
});
export const storefrontSchema = dealerStoreSchema.extend({
  banners: z.array(z.object({ id: z.string().uuid(), imagePath: z.string(), heading: nullableText, description: nullableText })),
  categories: z.array(z.object({ id: z.string().uuid(), name: z.string(), description: nullableText, imagePath: z.string().nullable().optional().default(null) })),
  brands: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
});
export const availabilitySchema = z.enum(["in_stock", "low_stock", "out_of_stock", "enquire"]);
const cardVariantSchema = z.object({
  id: z.string().uuid(), name: z.string(), price: z.number().nonnegative(),
  moq: z.number().int().positive(), packSize: nullableText, availability: availabilitySchema,
});
export const storeProductCardSchema = z.object({
  id: z.string().uuid(), storeId: z.string().uuid(), name: z.string(), unit: z.string(),
  brandName: nullableText, categoryName: nullableText, imagePath: nullableText,
  variantCount: z.number().int().positive(), variant: cardVariantSchema,
});
export const dealerProductPageSchema = z.object({
  items: z.array(storeProductCardSchema), total: z.number().int().nonnegative(), pageSize: z.number().int().positive(),
});
export const dealerProductSchema = z.object({
  id: z.string().uuid(), storeId: z.string().uuid(), name: z.string(), unit: z.string(),
  description: nullableText, packagingDetails: nullableText,
  brandName: nullableText, categoryName: nullableText,
  images: z.array(z.object({ imagePath: z.string(), altText: nullableText })),
  variants: z.array(cardVariantSchema.extend({
    quantityStep: z.number().int().positive(), unitsPerPack: z.number().int().positive().nullable(),
    stockQuantity: z.number().int().nonnegative().nullable(), sku: nullableText,
  })),
});
export type DealerStore = z.infer<typeof dealerStoreSchema>;
export type DealerStorefront = z.infer<typeof storefrontSchema>;
export type StoreProductCard = z.infer<typeof storeProductCardSchema>;
export type DealerProduct = z.infer<typeof dealerProductSchema>;
export type ProductSort = "newest" | "price_low" | "price_high";
export interface DealerProductFilters {
  storeId: string; page: number; search: string;
  categoryId: string; brandId: string; sort: ProductSort;
}
