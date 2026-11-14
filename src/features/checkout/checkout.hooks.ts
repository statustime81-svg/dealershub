import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { getOrderConfirmation, submitOrder } from "./checkout.api";
export function useSubmitOrder(storeId: string, dealerId?: string) {
  const { user } = useAuth(); const cache = useQueryClient();
  const keys = useRef(new Map<string, string>());
  return useMutation({
    retry: false,
    mutationFn: async (input: { cartId: string; fingerprint: string }) => {
      if (!user) throw new Error("Sign in first.");
      const storageKey = `dealershub:order:${user.id}:${dealerId ?? "self"}:${input.cartId}:${input.fingerprint}`;
      let idempotencyKey = keys.current.get(storageKey);
      try {
        const existing = sessionStorage.getItem(storageKey);
        if (z.string().uuid().safeParse(existing).success) idempotencyKey = existing!;
      } catch { /* In-memory fallback when browser storage is unavailable. */ }
      if (!idempotencyKey) idempotencyKey = crypto.randomUUID();
      keys.current.set(storageKey, idempotencyKey);
      try { sessionStorage.setItem(storageKey, idempotencyKey); } catch { /* Preserve the in-memory key. */ }
      const result = await submitOrder({ ...input, idempotencyKey });
      keys.current.delete(storageKey);
      try { sessionStorage.removeItem(storageKey); } catch { /* No credentials are stored. */ }
      return result;
    },
    onSuccess: async () => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["user", user?.id, "order-cart", storeId] }),
        cache.invalidateQueries({ queryKey: ["user", user?.id, "dealer-products"] }),
        cache.invalidateQueries({ queryKey: ["user", user?.id, "dealer-product", storeId] }),
        cache.invalidateQueries({ queryKey: ["user", user?.id, "salesperson"] }),
        cache.invalidateQueries({ queryKey: ["user", user?.id, "orders"] }),
      ]);
    },
  });
}
export function useOrderConfirmation(orderId: string) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["user", user?.id, "order-confirmation", orderId], enabled: Boolean(user && orderId),
    queryFn: ({ signal }) => getOrderConfirmation(orderId, signal) });
}
