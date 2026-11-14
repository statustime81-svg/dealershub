import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getAssignedDealers, getAssignedDealerWorkspace, getAssignedStore, getAssignedProducts, getAssignedProduct, getAssignedOrder } from "./salesperson.api";
import type { SalespersonShoppingScope } from "./salesperson.schemas";
import type { DealerProductFilters } from "@/features/storefront/storefront.schemas";
export function useAssignedDealers(businessId: string, search: string, page: number) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["user", user?.id, "salesperson", businessId, "assigned-dealers", search, page],
    enabled: Boolean(user && businessId), queryFn: ({ signal }) => getAssignedDealers(businessId, search, page, signal), refetchInterval: 30000 });
}
export function useAssignedDealerWorkspace(businessId: string, dealerId: string) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["user", user?.id, "salesperson", businessId, "dealer", dealerId], enabled: Boolean(user && businessId && dealerId),
    queryFn: ({ signal }) => getAssignedDealerWorkspace(businessId, dealerId, signal), staleTime: 0, refetchInterval: 30000 });
}
export function useAssignedStore(scope: SalespersonShoppingScope) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["user", user?.id, "salesperson", scope.businessId, scope.dealerId, scope.storeId, "store"],
    enabled: Boolean(user && scope.businessId && scope.dealerId && scope.storeId), queryFn: ({ signal }) => getAssignedStore(scope, signal), refetchInterval: 30000 });
}
export function useAssignedProducts(scope: SalespersonShoppingScope, filters: Omit<DealerProductFilters, "storeId">) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["user", user?.id, "salesperson", scope.businessId, scope.dealerId, scope.storeId, "products", filters],
    enabled: Boolean(user && scope.storeId), queryFn: ({ signal }) => getAssignedProducts(scope, filters, signal) });
}
export function useAssignedProduct(scope: SalespersonShoppingScope, productId: string) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["user", user?.id, "salesperson", scope.businessId, scope.dealerId, scope.storeId, "product", productId],
    enabled: Boolean(user && scope.storeId && productId), queryFn: ({ signal }) => getAssignedProduct(scope, productId, signal) });
}
export function useAssignedOrder(businessId: string, orderId: string) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["user", user?.id, "salesperson", businessId, "order", orderId], enabled: Boolean(user && businessId && orderId),
    queryFn: ({ signal }) => getAssignedOrder(businessId, orderId, signal), refetchInterval: 30000, staleTime: 0 });
}
