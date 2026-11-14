import { z } from "zod";
import { orderStatusSchema } from "@/features/orders/orders.schemas";
export const businessStatusSchema=z.enum(["active","suspended"]);
export const verificationSchema=z.enum(["verified","unverified"]);
export const businessTypeSchema=z.enum(["manufacturer","distributor"]);
export const platformRoleSchema=z.enum(["super_admin","business_admin","dealer","salesperson"]);
const count=z.number().int().nonnegative();
export const platformOverviewSchema=z.object({
  businesses:count,activeBusinesses:count,suspendedBusinesses:count,verifiedBusinesses:count,
  users:count,dealers:count,activeSalespeople:count,orders:count,submittedOrderValue:z.number().nonnegative(),
  orderStatuses:z.array(z.object({status:orderStatusSchema,count})),
});
export const platformBusinessRowSchema=z.object({
  id:z.string().uuid(),companyName:z.string(),businessType:businessTypeSchema,
  contactEmail:z.string(),ownerName:z.string().nullable(),status:businessStatusSchema,
  verificationStatus:verificationSchema,createdAt:z.string(),
});
export const platformBusinessListSchema=z.object({items:z.array(platformBusinessRowSchema),total:count,pageSize:z.number().int().positive()});
export const platformBusinessSchema=z.object({
  business:z.object({
    id:z.string().uuid(),companyName:z.string(),businessType:businessTypeSchema,
    contactEmail:z.string(),phone:z.string().nullable(),address:z.string().nullable(),gstin:z.string().nullable(),
    status:businessStatusSchema,verificationStatus:verificationSchema,createdAt:z.string(),updatedAt:z.string(),
    categoryName:z.string().nullable(),ownerName:z.string().nullable(),ownerEmail:z.string().nullable(),
  }),
  metrics:z.object({stores:count,activeProducts:count,activeDealers:count,activeSalespeople:count,orders:count,submittedOrderValue:z.number().nonnegative()}),
  subscription:z.object({planName:z.string(),status:z.enum(["trialing","active","expired","cancelled"]),startsAt:z.string(),endsAt:z.string().nullable()}).nullable(),
});
export const platformUserListSchema=z.object({
  total:count,pageSize:z.number().int().positive(),items:z.array(z.object({
    id:z.string().uuid(),email:z.string().nullable(),name:z.string().nullable(),phone:z.string().nullable(),
    emailVerified:z.boolean(),createdAt:z.string(),roles:z.array(platformRoleSchema),businessCount:count,
  })),
});
const actionState=z.object({status:businessStatusSchema,verificationStatus:verificationSchema});
export const platformAuditSchema=z.array(z.object({
  id:z.string().uuid(),actorName:z.string().nullable(),before:actionState,after:actionState,
  note:z.string().nullable(),createdAt:z.string(),
}));
export const platformBusinessActionSchema=z.object({
  action:z.literal("business.update"),businessId:z.string().uuid(),expectedUpdatedAt:z.string().datetime({offset:true}),
  status:businessStatusSchema,verificationStatus:verificationSchema,requestKey:z.string().uuid(),note:z.string().trim().max(2000),
});
export const platformActionResponseSchema=z.object({success:z.literal(true),businessId:z.string().uuid(),alreadyUpdated:z.boolean()});
export type PlatformOverview=z.infer<typeof platformOverviewSchema>;
export type PlatformBusiness=z.infer<typeof platformBusinessSchema>;
export type PlatformBusinessRow=z.infer<typeof platformBusinessRowSchema>;
export type PlatformUser=z.infer<typeof platformUserListSchema>["items"][number];
export type PlatformAudit=z.infer<typeof platformAuditSchema>;
export type PlatformBusinessAction=z.infer<typeof platformBusinessActionSchema>;
export interface PlatformBusinessFilters{
  search:string;status:"all"|z.infer<typeof businessStatusSchema>;
  verification:"all"|z.infer<typeof verificationSchema>;type:"all"|z.infer<typeof businessTypeSchema>;page:number;
}
export interface PlatformUserFilters{search:string;role:"all"|z.infer<typeof platformRoleSchema>;page:number;}
