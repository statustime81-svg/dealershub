import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";

import {
  getCatalogStores,
  getProducts,
  setProductActive,
  type ProductListInput,
} from "./catalog.api";

import { getEditorOptions } from "./catalog-editor.api";

export function useCatalogStores() {
  const { user } = useAuth();
  const { activeBusinessId } = useBusiness();

  return useQuery({
    queryKey: [
      "user",
      user?.id,
      "business",
      activeBusinessId,
      "catalog-stores",
    ],

    enabled: Boolean(user && activeBusinessId),

    queryFn: ({ signal }) => {
      if (!activeBusinessId) {
        throw new Error("Select a business.");
      }

      return getCatalogStores(
        activeBusinessId,
        signal,
      );
    },
  });
}

export function useProducts(input: ProductListInput) {
  const { user } = useAuth();
  const { activeBusinessId } = useBusiness();

  return useQuery({
    queryKey: [
      "user",
      user?.id,
      "business",
      activeBusinessId,
      "products",
      input,
    ],

    enabled: Boolean(
      user &&
      activeBusinessId &&
      input.storeId,
    ),

    queryFn: ({ signal }) =>
      getProducts(input, signal),
  });
}

export function useCatalogFilterOptions() {
  const { user } = useAuth();
  const { activeBusinessId } = useBusiness();

  return useQuery({
    queryKey: [
      "user",
      user?.id,
      "catalog-editor-options",
      activeBusinessId,
    ],

    enabled: Boolean(user && activeBusinessId),

    queryFn: ({ signal }) =>
      getEditorOptions(signal, activeBusinessId ?? undefined),
  });
}

export function useProductActivation() {
  const queryClient = useQueryClient();

  const { user } = useAuth();
  const { activeBusinessId } = useBusiness();

  const businessKey = [
    "user",
    user?.id,
    "business",
    activeBusinessId,
  ] as const;

  return useMutation({
    mutationFn: setProductActive,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: businessKey,
      });
    },
  });
}