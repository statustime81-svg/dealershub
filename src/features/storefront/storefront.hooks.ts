import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getAuthorizedStores, getDealerStore, getDealerProducts, getDealerProduct } from "./storefront.api";
import type { DealerProductFilters } from "./storefront.schemas";
export function useAuthorizedStores() {
  const { user } = useAuth();
  return useQuery({ queryKey: ["user", user?.id, "authorized-stores"], enabled: Boolean(user),
    queryFn: ({ signal }) => getAuthorizedStores(signal), staleTime: 0, refetchInterval: 30000 });
}
export function useDealerStore(storeId: string) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["user", user?.id, "dealer-storefront", storeId], enabled: Boolean(user && storeId),
    queryFn: ({ signal }) => getDealerStore(storeId, signal), staleTime: 0, refetchInterval: 30000 });
}
export function useDealerProducts(input: DealerProductFilters) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["user", user?.id, "dealer-products", input], enabled: Boolean(user && input.storeId),
    queryFn: ({ signal }) => getDealerProducts(input, signal) });
}
export function useDealerProduct(storeId: string, productId: string) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["user", user?.id, "dealer-product", storeId, productId], enabled: Boolean(user && storeId && productId),
    queryFn: ({ signal }) => getDealerProduct(storeId, productId, signal) });
}
