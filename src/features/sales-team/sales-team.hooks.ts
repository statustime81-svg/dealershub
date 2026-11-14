import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";

import { getSalesTeam } from "./sales-team.api";

export function useSalesTeam(
  page: number,
  search: string,
) {
  const { user } = useAuth();
  const { activeBusinessId } = useBusiness();

  return useQuery({
    queryKey: [
      "user",
      user?.id,
      "business",
      activeBusinessId,
      "sales-team",
      { page, search },
    ],

    enabled: Boolean(
      user && activeBusinessId,
    ),

    queryFn: ({ signal }) => {
      if (!activeBusinessId) {
        throw new Error("Select a business.");
      }

      return getSalesTeam(
        activeBusinessId,
        page,
        search,
        signal,
      );
    },
  });
}