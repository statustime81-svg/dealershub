import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";

import {
  getProductImageUrl,
} from "@/lib/supabase/storage.api";

export function useSignedImage(
  path: string | null | undefined,
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [
      "user",
      user?.id,
      "signed-product-image",
      path ?? null,
    ],

    enabled: Boolean(user && path),

    queryFn: async () => {
      if (!path) {
        throw new Error("Image path is required.");
      }

      return getProductImageUrl(path);
    },

    staleTime: 240_000,

    gcTime: 300_000,

    refetchInterval: 240_000,

    refetchOnWindowFocus: true,

    retry: false,
  });
}