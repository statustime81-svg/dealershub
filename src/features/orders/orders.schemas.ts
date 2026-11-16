import { z } from "zod";
export const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "rejected",
  "processing",
  "dispatched",
  "delivered",
  "cancelled",
]);
export const orderListRowSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.number().int().positive(),
  status: orderStatusSchema,
  total: z.number().nonnegative(),
  createdAt: z.string(),
  storeName: z.string(),
  businessName: z.string(),
  dealerName: z.string(),
  salespersonName: z.string().nullable(),
  itemCount: z.number().int().nonnegative(),
});
export const orderListSchema = z.object({
  items: z.array(orderListRowSchema),
  total: z.number().int().nonnegative(),
  pageSize: z.number().int().positive(),
});
export const orderWorkspaceSchema = z.object({
  order: z.object({
    id: z.string().uuid(),
    orderNumber: z.number().int().positive(),
    status: orderStatusSchema,
    storeName: z.string(),
    businessName: z.string(),
    dealerName: z.string(),
    dealerPhone: z.string().nullable(),
    dealerAddress: z.string().nullable(),
    salespersonName: z.string().nullable(),
    taxIncluded: z.boolean().optional().default(false),
    subtotal: z.number().nonnegative(),
    discountTotal: z.number().nonnegative(),
    taxTotal: z.number().nonnegative(),
    deliveryTotal: z.number().nonnegative(),
    total: z.number().nonnegative(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  canManage: z.boolean(),
  statusUpdatesReady: z.boolean(),
  allowedStatuses: z.array(orderStatusSchema),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      productName: z.string(),
      variantName: z.string(),
      sku: z.string().nullable(),
      unit: z.string(),
      packSize: z.string().nullable(),
      price: z.number().nonnegative(),
      quantity: z.number().int().positive(),
      total: z.number().nonnegative(),
    }),
  ),
  history: z.array(
    z.object({
      id: z.string().uuid(),
      previousStatus: orderStatusSchema.nullable(),
      status: orderStatusSchema,
      note: z.string().nullable(),
      createdAt: z.string(),
    }),
  ),
  documents: z.array(
    z.object({
      id: z.string().uuid(),
      fileName: z.string(),
      filePath: z.string(),
      createdAt: z.string(),
    }),
  ),
});
export const orderStatusMutationSchema = z.object({
  orderId: z.string().uuid(),
  expectedStatus: orderStatusSchema,
  expectedUpdatedAt: z.string().datetime({ offset: true }),
  newStatus: orderStatusSchema,
  requestKey: z.string().uuid(),
  note: z.string().trim().max(2000),
});
export const orderStatusResponseSchema = z.object({
  success: z.literal(true),
  orderId: z.string().uuid(),
  status: orderStatusSchema,
  alreadyUpdated: z.boolean(),
});
export type OrderListRow = z.infer<typeof orderListRowSchema>;
export type OrderWorkspace = z.infer<typeof orderWorkspaceSchema>;
export type OrderStatusMutation = z.infer<typeof orderStatusMutationSchema>;
export type OrderScope = "manufacturer" | "dealer" | "salesperson";
export interface OrderListInput {
  scope: OrderScope;
  businessId: string | null;
  page: number;
  status: "all" | z.infer<typeof orderStatusSchema>;
  search: string;
}
