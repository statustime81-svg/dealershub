import { z } from "zod";
export const availabilitySchema=z.enum(["in_stock","low_stock","out_of_stock","enquire"]);
export const inventoryRowSchema=z.object({id:z.string().uuid(),store_id:z.string().uuid(),product_id:z.string().uuid(),name:z.string(),sku:z.string().nullable(),stock_quantity:z.number().int().nonnegative().nullable(),availability:availabilitySchema,updated_at:z.string(),is_active:z.boolean(),product_name:z.string(),store_name:z.string()});
export type InventoryRow=z.infer<typeof inventoryRowSchema>;
export const inventoryListSchema=z.object({items:z.array(inventoryRowSchema),total:z.number().int(),pageSize:z.number().int().positive()});
export const stockUpdateSchema=z.object({variantId:z.string().uuid(),expectedUpdatedAt:z.string(),quantity:z.number().int().min(0).max(2147483647).nullable(),availability:availabilitySchema});
export type StockUpdate=z.infer<typeof stockUpdateSchema>;
