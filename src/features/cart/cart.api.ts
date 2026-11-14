import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabase/client";
import { cartQuoteSchema, cartMutationSchema, type CartMutationInput } from "./cart.schemas";
export async function getCartQuote(storeId: string, signal?: AbortSignal, dealerId?: string) {
  z.string().uuid().parse(storeId);
  if (dealerId) z.string().uuid().parse(dealerId);
  let request = getSupabaseClient().rpc("get_order_cart", { p_store_id: storeId, p_dealer_id: dealerId ?? null });
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request; if (error) throw error;
  return cartQuoteSchema.parse(data);
}
export async function mutateCart(values: CartMutationInput, dealerId?: string) {
  const input = cartMutationSchema.parse(values);
  if (dealerId) z.string().uuid().parse(dealerId);
  const { data, error } = await getSupabaseClient().rpc("mutate_order_cart", {
    p_store_id: input.storeId, p_variant_id: input.variantId,
    p_quantity: input.quantity, p_mode: input.mode,
    p_expected_quantity: input.expectedQuantity ?? null, p_dealer_id: dealerId ?? null,
  });
  if (error) throw error;
  return cartQuoteSchema.parse(data);
}
