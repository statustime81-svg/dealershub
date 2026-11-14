import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";

import {
  getAssignmentOptions,
  getSalespersonWorkspace,
  setDealerAssignment,
} from "./assignments.api";

export function useAssignmentOptions() {
  const { user } = useAuth();
  const { activeBusinessId } = useBusiness();

  return useQuery({
    queryKey: [
      "user",
      user?.id,
      "business",
      activeBusinessId,
      "assignment-options",
    ],

    enabled: Boolean(user && activeBusinessId),

    queryFn: ({ signal }) => {
      if (!activeBusinessId) {
        throw new Error("Select a business.");
      }

      return getAssignmentOptions(
        activeBusinessId,
        signal,
      );
    },
  });
}

export function useSalespersonWorkspace(
  salespersonId: string,
) {
  const { user } = useAuth();
  const { activeBusinessId } = useBusiness();

  return useQuery({
    queryKey: [
      "user",
      user?.id,
      "business",
      activeBusinessId,
      "salesperson-workspace",
      salespersonId,
    ],

    enabled: Boolean(
      user &&
      activeBusinessId &&
      salespersonId,
    ),

    queryFn: ({ signal }) => {
      if (!activeBusinessId) {
        throw new Error("Select a business.");
      }

      return getSalespersonWorkspace(
        activeBusinessId,
        salespersonId,
        signal,
      );
    },
  });
}

export function useAssignmentMutation() {
  const cache = useQueryClient();

  const { user } = useAuth();
  const { activeBusinessId } = useBusiness();

  const businessKey = [
    "user",
    user?.id,
    "business",
    activeBusinessId,
  ] as const;

  return useMutation({
    mutationFn: setDealerAssignment,

    onSuccess: async () => {
      await cache.invalidateQueries({
        queryKey: businessKey,
      });
    },
  });
}