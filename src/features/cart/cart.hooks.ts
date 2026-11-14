import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getCartQuote, mutateCart } from "./cart.api";
import type { CartMutationInput } from "./cart.schemas";
function cartKey(userId: string | undefined, storeId: string, dealerId?: string) {
  const base = ["user", userId, "order-cart", storeId];
  return dealerId ? [...base, "on-behalf", dealerId] : base;
}
export function useCart(storeId: string, dealerId?: string) {
  const { user } = useAuth();
  return useQuery({ queryKey: cartKey(user?.id, storeId, dealerId), enabled: Boolean(user && storeId),
    queryFn: ({ signal }) => getCartQuote(storeId, signal, dealerId), staleTime: 0 });
}
export function useCartMutation(storeId: string, dealerId?: string) {
  const { user } = useAuth(); const cache = useQueryClient();
  const key = cartKey(user?.id, storeId, dealerId);
  return useMutation({
    mutationFn: (values: CartMutationInput) => {
      if (values.storeId !== storeId) throw new Error("The selected store changed.");
      return mutateCart(values, dealerId);
    },
    retry: false,
    onSuccess: (quote) => { cache.setQueryData(key, quote); },
    onError: async () => { await cache.invalidateQueries({ queryKey: key }); },
  });
}
