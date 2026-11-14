import { z } from "zod";
export const assignedDealerSchema = z.object({
  dealerId: z.string().uuid(), companyName: z.string(),
  phone: z.string().nullable(), address: z.string().nullable(), storeCount: z.number().int().positive(),
});
export const assignedDealerListSchema = z.object({
  items: z.array(assignedDealerSchema), total: z.number().int().nonnegative(), pageSize: z.number().int().positive(),
});
export const dealerWorkspaceSchema = z.object({
  dealerId: z.string().uuid(), companyName: z.string(), phone: z.string().nullable(), address: z.string().nullable(),
  stores: z.array(z.object({ id: z.string().uuid(), name: z.string() })).min(1),
});
export const salespersonShoppingScopeSchema = z.object({
  businessId: z.string().uuid(), dealerId: z.string().uuid(), storeId: z.string().uuid(),
});
export type AssignedDealer = z.infer<typeof assignedDealerSchema>;
export type DealerWorkspace = z.infer<typeof dealerWorkspaceSchema>;
export type SalespersonShoppingScope = z.infer<typeof salespersonShoppingScopeSchema>;
