import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabase/client";
import { invokeAuthenticatedFunction } from "@/lib/supabase/function-client";
import { orderListSchema, orderWorkspaceSchema, orderStatusMutationSchema, orderStatusResponseSchema, type OrderListInput, type OrderStatusMutation } from "./orders.schemas";
export async function getOrderList(input: OrderListInput, signal?: AbortSignal) {
  let request = getSupabaseClient().rpc("get_order_list", {
    p_scope: input.scope, p_business_id: input.businessId,
    p_status: input.status, p_search: input.search, p_page: input.page,
  });
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return orderListSchema.parse(data);
}
export async function getOrderWorkspace(orderId: string, signal?: AbortSignal) {
  z.string().uuid().parse(orderId);
  let request = getSupabaseClient().rpc("get_order_workspace", { p_order_id: orderId });
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return orderWorkspaceSchema.parse(data);
}
export async function updateOrderStatus(values: OrderStatusMutation) {
  const input = orderStatusMutationSchema.parse(values);
  const response = await invokeAuthenticatedFunction<unknown>("update-order-status", input);
  return orderStatusResponseSchema.parse(response);
}
export async function downloadOrderInvoice(filePath: string): Promise<Blob> {
  const { data, error } = await getSupabaseClient().storage.from("order-documents").download(filePath);
  if (error || !data) throw error ?? new Error("Invoice unavailable.");
  return data;
}
