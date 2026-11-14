import { getSupabaseClient } from "@/lib/supabase/client";
import { storefrontSchema, dealerProductPageSchema, dealerProductSchema, type DealerProductFilters } from "@/features/storefront/storefront.schemas";
import { orderWorkspaceSchema } from "@/features/orders/orders.schemas";
import { assignedDealerListSchema, dealerWorkspaceSchema, salespersonShoppingScopeSchema, type SalespersonShoppingScope } from "./salesperson.schemas";
export async function getAssignedDealers(businessId: string, search: string, page: number, signal?: AbortSignal) {
  let request = getSupabaseClient().rpc("get_salesperson_dealers", { p_business_id: businessId, p_search: search, p_page: page });
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request; if (error) throw error;
  return assignedDealerListSchema.parse(data);
}
export async function getAssignedDealerWorkspace(businessId: string, dealerId: string, signal?: AbortSignal) {
  let request = getSupabaseClient().rpc("get_salesperson_dealer_workspace", { p_business_id: businessId, p_dealer_id: dealerId });
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request; if (error) throw error;
  return dealerWorkspaceSchema.parse(data);
}
function scopeArgs(scope: SalespersonShoppingScope) {
  salespersonShoppingScopeSchema.parse(scope);
  return { p_business_id: scope.businessId, p_dealer_id: scope.dealerId, p_store_id: scope.storeId };
}
export async function getAssignedStore(scope: SalespersonShoppingScope, signal?: AbortSignal) {
  let request = getSupabaseClient().rpc("get_salesperson_storefront", scopeArgs(scope));
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request; if (error) throw error;
  return storefrontSchema.parse(data);
}
export async function getAssignedProducts(scope: SalespersonShoppingScope, filters: Omit<DealerProductFilters, "storeId">, signal?: AbortSignal) {
  let request = getSupabaseClient().rpc("get_salesperson_products", {
    ...scopeArgs(scope), p_page: filters.page, p_search: filters.search,
    p_category_id: filters.categoryId || null, p_brand_id: filters.brandId || null, p_sort: filters.sort,
  });
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request; if (error) throw error;
  return dealerProductPageSchema.parse(data);
}
export async function getAssignedProduct(scope: SalespersonShoppingScope, productId: string, signal?: AbortSignal) {
  let request = getSupabaseClient().rpc("get_salesperson_product", { ...scopeArgs(scope), p_product_id: productId });
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request; if (error) throw error;
  return dealerProductSchema.parse(data);
}
export async function getAssignedOrder(businessId: string, orderId: string, signal?: AbortSignal) {
  let request = getSupabaseClient().rpc("get_salesperson_order_workspace", { p_business_id: businessId, p_order_id: orderId });
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request; if (error) throw error;
  return orderWorkspaceSchema.parse(data);
}
