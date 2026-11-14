import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabase/client";
import { invokeAuthenticatedFunction } from "@/lib/supabase/function-client";
import { submitOrderSchema, submitOrderResponseSchema, confirmationSchema, type SubmitOrderValues } from "./checkout.schemas";
export async function submitOrder(input: SubmitOrderValues) {
  const values = submitOrderSchema.parse(input);
  const result = await invokeAuthenticatedFunction<unknown>("submit-order", values);
  return submitOrderResponseSchema.parse(result);
}
export async function getOrderConfirmation(orderId: string, signal?: AbortSignal) {
  z.string().uuid().parse(orderId);
  let request = getSupabaseClient().rpc("get_actor_order_confirmation", { p_order_id: orderId });
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return confirmationSchema.parse(data);
}
