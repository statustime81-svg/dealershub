import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabase/client";
import { cartQuoteSchema } from "@/features/cart/cart.schemas";
export const paymentPlans = [
  "advance50",
  "credit30",
  "credit60",
  "credit90",
] as const;
export type PaymentPlan = (typeof paymentPlans)[number];
export const addressSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(6).max(40),
  address: z.string().trim().min(5).max(2000),
});
export type ShippingAddress = z.infer<typeof addressSchema>;
export const policySchema = z.object({
  paymentMode: z.enum(["test", "manual"]),
  taxMode: z.enum(["extra", "included"]),
  taxDelivery: z.boolean(),
  advanceBase: z.enum(["order", "advance"]),
  advanceBalanceDays: z.number().int().min(1).max(365),
  credit30Timing: z.enum(["selection", "settlement"]),
  creditStart: z.enum(["order", "delivery"]),
  stockPoint: z.enum(["placement", "confirmation", "dispatch"]),
  addressSource: z.enum(["manufacturer", "dealer"]),
  deliveryFee: z
    .number()
    .finite()
    .min(0)
    .max(1000000)
    .refine(
      (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001,
      "Use two decimal places.",
    ),
});
export const checkoutQuoteSchema = cartQuoteSchema.extend({
  plan: z.enum(paymentPlans),
  policy: policySchema.nullable(),
  suggestedAddress: z
    .object({ name: z.string(), phone: z.string(), address: z.string() })
    .nullable(),
  potentialDiscount: z.number(),
  potentialTotal: z.number().nullable(),
  advanceRequired: z.number().nullable(),
  taxIncluded: z.boolean().optional().default(false),
});
export type CheckoutQuote = z.infer<typeof checkoutQuoteSchema>;
export interface CheckoutInput {
  cartId: string;
  fingerprint: string;
  plan: PaymentPlan;
  address: ShippingAddress;
}
export async function termsRpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await getSupabaseClient().rpc(name, args);
  if (error)
    throw new Error(
      error.code === "P0001"
        ? error.message
        : error.code === "23505"
          ? "This payment reference is already recorded."
          : "Unable to complete this action. Refresh and check your permissions and database migration.",
    );
  return data as unknown;
}
export async function getCheckoutQuote(
  storeId: string,
  plan: PaymentPlan,
  address: ShippingAddress | null,
  dealerId?: string,
) {
  return checkoutQuoteSchema.parse(
    await termsRpc("get_checkout_quote", {
      p_store_id: storeId,
      p_plan: plan,
      p_address: address,
      p_dealer_id: dealerId ?? null,
    }),
  );
}
export async function getCheckoutPolicy(businessId: string) {
  const { data, error } = await getSupabaseClient()
    .from("business_checkout_policies")
    .select("config,revision")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  return data
    ? {
        config: policySchema.parse(data.config),
        revision: z.number().parse(data.revision),
      }
    : null;
}
export const orderTermsSchema = z.object({
  testMode: z.boolean(),
  nextPayment: z.number(),
  order_id: z.string(),
  plan: z.enum(paymentPlans),
  shipping_address: addressSchema,
  policy: policySchema,
  initial_quote: z.object({
    potentialDiscount: z.number(),
    potentialTotal: z.number().nullable(),
    advanceRequired: z.number().nullable(),
  }),
  due_at: z.string().nullable(),
  paid_total: z.number(),
  earned_discount: z.number(),
  carrier: z.string().nullable(),
  awb: z.string().nullable(),
  tracking_url: z.string().nullable(),
  shipping_updated_at: z.string().nullable(),
  taxIncluded: z.boolean(),
  total: z.number(),
  remaining: z.number(),
  creditBalance: z.number(),
  receipts: z.array(
    z.object({
      id: z.string(),
      amount: z.number(),
      reference: z.string(),
      isTest: z.boolean(),
      receivedAt: z.string(),
    }),
  ),
});
export type OrderTerms = z.infer<typeof orderTermsSchema>;
export async function getOrderTerms(orderId: string) {
  return orderTermsSchema
    .nullable()
    .parse(
      await termsRpc("get_checkout_order_details", { p_order_id: orderId }),
    );
}
export function safeTrackingUrl(value: string | null) {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
