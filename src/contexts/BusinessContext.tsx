import {
  createContext,
  useState,
  type ReactNode,
} from "react";

import { useQuery } from "@tanstack/react-query";

import { z } from "zod";

import { useAuth } from "@/hooks/useAuth";

import { getSupabaseClient } from "@/lib/supabase/client";

import {
  membershipListSchema,
  type VerifiedBusinessMembership,
} from "@/features/businesses/businesses.schemas";

interface AccountAccess {
  memberships: VerifiedBusinessMembership[];
  isPlatformAdmin: boolean;
  isDealer: boolean;
}

interface BusinessContextValue extends AccountAccess {
  activeBusinessId: string | null;

  activeMembership:
    | VerifiedBusinessMembership
    | null;

  isLoading: boolean;
  error: Error | null;

  selectBusiness: (businessId: string) => void;
  refreshAccess: () => Promise<void>;
}

export const BusinessContext =
  createContext<BusinessContextValue | undefined>(
    undefined,
  );

const identitySchema = z.object({
  user_id: z.string().uuid(),
}).nullable();

interface BusinessProviderProps {
  children: ReactNode;
}

export function BusinessProvider({
  children,
}: BusinessProviderProps) {
  const {
    user,
    isLoading: authLoading,
    isConfigured,
  } = useAuth();

  const [selection, setSelection] = useState<{
    userId: string;
    businessId: string;
  } | null>(null);

  const access = useQuery({
    queryKey: [
      "user",
      user?.id ?? null,
      "account-access",
    ],

    enabled: Boolean(
      user &&
      isConfigured &&
      !authLoading,
    ),

    queryFn: async ({ signal }): Promise<AccountAccess> => {
      if (!user) {
        throw new Error("Sign in first.");
      }

      const supabase = getSupabaseClient();

      const [
        membershipResult,
        platformResult,
        dealerResult,
      ] = await Promise.all([
        supabase
          .from("business_memberships")
          .select(
            "id, business_id, user_id, role, status, business:businesses!inner(company_name, business_type, status)",
          )
          .eq("user_id", user.id)
          .eq("status", "active")
          .eq("business.status", "active")
          .abortSignal(signal),

        supabase
          .from("platform_admins")
          .select("user_id")
          .eq("user_id", user.id)
          .abortSignal(signal)
          .maybeSingle(),

        supabase
          .from("dealer_profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .abortSignal(signal)
          .maybeSingle(),
      ]);

      if (membershipResult.error) {
        throw membershipResult.error;
      }

      if (platformResult.error) {
        throw platformResult.error;
      }

      if (dealerResult.error) {
        throw dealerResult.error;
      }

      return {
        memberships: membershipListSchema.parse(
          membershipResult.data ?? [],
        ),

        isPlatformAdmin: Boolean(
          identitySchema.parse(platformResult.data),
        ),

        isDealer: Boolean(
          identitySchema.parse(dealerResult.data),
        ),
      };
    },
  });

  const memberships =
    access.data?.memberships ?? [];

  const selectedBusinessId =
    selection?.userId === user?.id
      ? selection?.businessId
      : null;

  const activeMembership =
    memberships.find(
      (membership) =>
        membership.business_id === selectedBusinessId,
    ) ??
    memberships[0] ??
    null;

  function selectBusiness(
    businessId: string,
  ): void {
    if (
      !user ||
      !memberships.some(
        (membership) =>
          membership.business_id === businessId,
      )
    ) {
      throw new Error(
        "This business is not available to your account.",
      );
    }

    setSelection({
      userId: user.id,
      businessId,
    });
  }

  async function refreshAccess(): Promise<void> {
    if (!user || !isConfigured) {
      return;
    }

    const result = await access.refetch();

    if (result.error) {
      throw result.error;
    }
  }

  return (
    <BusinessContext.Provider
      value={{
        memberships,

        isPlatformAdmin:
          access.data?.isPlatformAdmin ?? false,

        isDealer:
          access.data?.isDealer ?? false,

        activeBusinessId:
          activeMembership?.business_id ?? null,

        activeMembership,

        isLoading:
          authLoading ||
          (
            Boolean(user) &&
            isConfigured &&
            access.isPending
          ),

        error: access.error,

        selectBusiness,
        refreshAccess,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}