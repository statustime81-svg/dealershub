import { z } from "zod";

export const storeSettingsSchema = z.object({
  name: z.string().trim().min(1, "Enter your store name.").max(200),
  slug: z.string().trim().min(1).max(100).regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens.",
  ),
  description: z.string().trim().max(3000),
  isPublished: z.boolean(),
});
export type StoreSettingsValues = z.infer<typeof storeSettingsSchema>;

export const storeBannerFormSchema = z.object({
  imagePath: z.string().min(1, "Upload a banner image."),
  heading: z.string().trim().max(200),
  description: z.string().trim().max(1000),
  sortOrder: z.number().int().min(0).max(2147483647),
  isActive: z.boolean(),
});
export type StoreBannerValues = z.infer<typeof storeBannerFormSchema>;

export const storeWorkspaceSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  is_published: z.boolean(),
  updated_at: z.string(),
  business: z.object({
    company_name: z.string(),
    logo_path: z.string().nullable(),
    business_type: z.enum(["manufacturer", "distributor"]),
    verification_status: z.enum(["unverified", "verified"]),
  }),
});
export type StoreWorkspaceData = z.infer<typeof storeWorkspaceSchema>;

export const storeBannerSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  image_path: z.string(),
  heading: z.string().nullable(),
  description: z.string().nullable(),
  sort_order: z.number().int(),
  is_active: z.boolean(),
});
export type StoreBanner = z.infer<typeof storeBannerSchema>;

export const taxonomyItemSchema = z.object({
  id: z.string().uuid(), name: z.string(), is_active: z.boolean(),
});
export type TaxonomyItem = z.infer<typeof taxonomyItemSchema>;
export type StoreTaxonomyKind = "categories" | "brands";
