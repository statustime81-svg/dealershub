import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { getStoreWorkspace, getStoreBanners, getStoreTaxonomy } from "./stores.api";
import type { StoreTaxonomyKind } from "./stores.schemas";

export function useStoreWorkspace(storeId: string) {
  const { user } = useAuth();
  const { activeBusinessId } = useBusiness();
  return useQuery({
    queryKey: ["user", user?.id, "business", activeBusinessId, "store-workspace", storeId],
    enabled: Boolean(user && activeBusinessId && storeId),
    queryFn: ({ signal }) => {
      if (!activeBusinessId) throw new Error("Select a business.");
      return getStoreWorkspace(activeBusinessId, storeId, signal);
    },
  });
}
export function useStoreBanners(storeId: string) {
  const { user } = useAuth();
  const { activeBusinessId } = useBusiness();
  return useQuery({
    queryKey: ["user", user?.id, "business", activeBusinessId, "store-banners", storeId],
    enabled: Boolean(user && activeBusinessId && storeId),
    queryFn: ({ signal }) => getStoreBanners(storeId, signal),
  });
}
export function useStoreTaxonomy(storeId: string, kind: StoreTaxonomyKind) {
  const { user } = useAuth();
  const { activeBusinessId } = useBusiness();
  return useQuery({
    queryKey: ["user", user?.id, "business", activeBusinessId, "store-taxonomy", storeId, kind],
    enabled: Boolean(user && activeBusinessId && storeId),
    queryFn: ({ signal }) => getStoreTaxonomy(storeId, kind, signal),
  });
}
