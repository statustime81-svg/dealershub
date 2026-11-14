import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";

import {
  getEditorOptions,
  getEditorProduct,
  saveEditorProduct,
} from "./catalog-editor.api";

export function useEditorOptions() {
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

export function useEditorProduct(
  storeId: string,
  productId: string | undefined,
) {
  const { user } = useAuth();
  const { activeBusinessId } = useBusiness();

  return useQuery({
    queryKey: [
      "user",
      user?.id,
      "business",
      activeBusinessId,
      "editor-product",
      storeId,
      productId,
    ],

    enabled: Boolean(
      user &&
      activeBusinessId &&
      storeId &&
      productId,
    ),

    queryFn: ({ signal }) => {
      if (!productId) {
        throw new Error("Product ID is required.");
      }

      return getEditorProduct(
        storeId,
        productId,
        signal,
      );
    },
  });
}

export function useSaveEditorProduct() {
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
    mutationFn: saveEditorProduct,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: businessKey,
      });
    },
  });
}