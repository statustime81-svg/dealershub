import { z } from "zod";
export const taxonomyKindSchema=z.enum(["business_categories","product_categories","brands"]);
export type TaxonomyKind=z.infer<typeof taxonomyKindSchema>;
export const taxonomyRowSchema=z.object({id:z.string().uuid(),name:z.string(),slug:z.string(),is_active:z.boolean(),revision:z.number().int().positive()});
export type TaxonomyRow=z.infer<typeof taxonomyRowSchema>;
export const taxonomyListSchema=z.object({items:z.array(taxonomyRowSchema),total:z.number().int(),pageSize:z.number().int().positive()});
const limit=z.number().int().nonnegative().nullable();
export const planSchema=z.object({id:z.string().uuid(),name:z.string(),slug:z.string(),description:z.string().nullable(),price_amount:z.number().nullable(),currency:z.string(),billing_interval:z.enum(["month","year","custom"]).nullable(),max_products:limit,max_dealers:limit,max_salespeople:limit,max_stores:limit,max_storage_bytes:limit,is_active:z.boolean(),revision:z.number().int().positive()});
export type PlatformPlan=z.infer<typeof planSchema>;
export const planListSchema=z.object({items:z.array(planSchema),total:z.number().int(),pageSize:z.number().int().positive()});
export const subscriptionSchema=z.object({id:z.string().uuid(),business_id:z.string().uuid(),plan_id:z.string().uuid(),status:z.enum(["trialing","active","expired","cancelled"]),starts_at:z.string(),ends_at:z.string().nullable(),revision:z.number().int().positive()});
export type PlatformSubscription=z.infer<typeof subscriptionSchema>;
export interface ConfigurationInput {kind:TaxonomyKind|"plan"|"subscription";id:string;revision:number|null;requestKey:string;values:Record<string,unknown>}
