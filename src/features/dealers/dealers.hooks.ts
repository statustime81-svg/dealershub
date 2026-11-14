import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";

import {
  getDealers,
  getDealerDetails,
  updateDealerAccess,
  type DealerListInput,
} from "./dealers.api";

export function useDealers(
  input: DealerListInput,
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [
      "user",
      user?.id,
      "business",
      input.businessId,
      "dealers",
      input,
    ],

    enabled: Boolean(
      user &&
      input.businessId &&
      input.storeId,
    ),

    queryFn: ({ signal }) =>
      getDealers(input, signal),
  });
}

export function useDealerDetails(
  dealerId: string,
) {
  const { user } = useAuth();
  const { activeBusinessId } = useBusiness();

  return useQuery({
    queryKey: [
      "user",
      user?.id,
      "business",
      activeBusinessId,
      "dealer-details",
      dealerId,
    ],

    enabled: Boolean(
      user &&
      activeBusinessId &&
      dealerId,
    ),

    queryFn: ({ signal }) => {
      if (!activeBusinessId) {
        throw new Error("Select a business.");
      }

      return getDealerDetails(
        activeBusinessId,
        dealerId,
        signal,
      );
    },
  });
}

export function useDealerAccessMutation() {
  const cache = useQueryClient();

  const { user } = useAuth();
  const { activeBusinessId } = useBusiness();

  const key = [
    "user",
    user?.id,
    "business",
    activeBusinessId,
  ] as const;

  return useMutation({
    mutationFn: updateDealerAccess,

    onSuccess: async () => {
      await cache.invalidateQueries({
        queryKey: key,
      });
    },
  });
}