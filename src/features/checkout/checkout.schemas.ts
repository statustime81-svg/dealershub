import { z } from "zod";
export const submitOrderSchema = z.object({
  cartId: z.string().uuid(), idempotencyKey: z.string().uuid(),
  fingerprint: z.string().regex(/^[a-f0-9]{32}$/),
});
export const submitOrderResponseSchema = z.object({
  success: z.literal(true), orderId: z.string().uuid(),
  orderNumber: z.number().int().positive(), alreadySubmitted: z.boolean(),
});
export const confirmationSchema = z.object({
  orderId: z.string().uuid(), orderNumber: z.number().int().positive(),
  status: z.enum(["pending", "confirmed", "rejected", "processing", "dispatched", "delivered", "cancelled"]),
  storeName: z.string(), businessName: z.string(), subtotal: z.number(),
  discountTotal: z.number(), taxTotal: z.number(), deliveryTotal: z.number(), total: z.number(), createdAt: z.string(),
});
export type SubmitOrderValues = z.infer<typeof submitOrderSchema>;
