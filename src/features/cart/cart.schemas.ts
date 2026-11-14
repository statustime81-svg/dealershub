import { z } from "zod";
export const cartLineSchema = z.object({
  id: z.string().uuid(), variantId: z.string().uuid(), productId: z.string().uuid(),
  name: z.string(), variantName: z.string(), unit: z.string(), packSize: z.string().nullable(),
  price: z.number().nonnegative(), quantity: z.number().int().positive(),
  moq: z.number().int().positive(), quantityStep: z.number().int().positive(),
  stockQuantity: z.number().int().nonnegative().nullable(),
  availability: z.enum(["in_stock", "low_stock", "out_of_stock", "enquire"]),
  imagePath: z.string().nullable(), lineTotal: z.number().nonnegative(), isOrderable: z.boolean(),
});
export const cartQuoteSchema = z.object({
  cartId: z.string().uuid().nullable(), storeId: z.string().uuid(),
  items: z.array(cartLineSchema), subtotal: z.number().nonnegative(),
  pricingReady: z.boolean(), canSubmit: z.boolean(),
  discountTotal: z.number().nonnegative().nullable(), taxTotal: z.number().nonnegative().nullable(),
  deliveryTotal: z.number().nonnegative().nullable(), total: z.number().nonnegative().nullable(),
  fingerprint: z.string().regex(/^[a-f0-9]{32}$/).nullable(),
});
export type CartLine = z.infer<typeof cartLineSchema>;
export type CartQuote = z.infer<typeof cartQuoteSchema>;
export const cartMutationSchema = z.object({
  storeId: z.string().uuid(), variantId: z.string().uuid(),
  quantity: z.number().int().min(0).max(2147483647),
  mode: z.enum(["add", "set", "remove"]),
  expectedQuantity: z.number().int().positive().optional(),
}).superRefine((value, context) => {
  if (value.mode !== "remove" && value.quantity < 1) context.addIssue({ code: "custom", path: ["quantity"], message: "Enter a positive quantity." });
  if (value.mode !== "add" && value.expectedQuantity === undefined) context.addIssue({ code: "custom", path: ["expectedQuantity"], message: "Refresh the cart before changing it." });
});
export type CartMutationInput = z.infer<typeof cartMutationSchema>;
