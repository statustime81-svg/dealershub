import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { getOrderList, getOrderWorkspace, updateOrderStatus } from "./orders.api";
import type { OrderListInput } from "./orders.schemas";
export function useOrderList(input: OrderListInput) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user", user?.id, "orders", input],
    enabled: Boolean(user && (input.scope !== "manufacturer" || input.businessId)),
    queryFn: ({ signal }) => getOrderList(input, signal), refetchInterval: 30000,
  });
}
export function useOrderWorkspace(orderId: string) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["user", user?.id, "order-workspace", orderId], enabled: Boolean(user && orderId),
    queryFn: ({ signal }) => getOrderWorkspace(orderId, signal), refetchInterval: 30000, staleTime: 0 });
}
export function useOrderStatusMutation(orderId: string) {
  const cache = useQueryClient(); const { user } = useAuth(); const { activeBusinessId } = useBusiness();
  async function refresh() {
    await Promise.all([
      cache.invalidateQueries({ queryKey: ["user", user?.id, "orders"] }),
      cache.invalidateQueries({ queryKey: ["user", user?.id, "order-workspace", orderId] }),
      cache.invalidateQueries({ queryKey: ["user", user?.id, "business", activeBusinessId] }),
      cache.invalidateQueries({ queryKey: ["user", user?.id, "order-confirmation", orderId] }),
    ]);
  }
  return useMutation({ mutationFn: updateOrderStatus, retry: false, onSuccess: refresh,
    onError: async () => { await cache.invalidateQueries({ queryKey: ["user", user?.id, "order-workspace", orderId] }); } });
}
