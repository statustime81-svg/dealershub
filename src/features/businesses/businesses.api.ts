import { routes } from "@/config/routes";

import { getSupabaseClient } from "@/lib/supabase/client";

import { invokeAuthenticatedFunction } from "@/lib/supabase/function-client";

import {
  businessCategoryListSchema,
  businessOnboardingSchema,
  onboardingResponseSchema,
  registerAccountSchema,
  type BusinessOnboardingValues,
  type RegisterAccountValues,
} from "./businesses.schemas";

export async function registerBusinessAccount(
  values: RegisterAccountValues,
) {
  const input = registerAccountSchema.parse(values);

  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,

    options: {
      emailRedirectTo: new URL(
        routes.onboarding,
        window.location.origin,
      ).toString(),

      data: {
        full_name: input.fullName,
      },
    },
  });

  if (error) {
    throw error;
  }

  return {
    hasSession: Boolean(data.session),
  };
}

export async function getBusinessCategories(
  signal?: AbortSignal,
) {
  const supabase = getSupabaseClient();

  let request = supabase
    .from("business_categories")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  if (signal) {
    request = request.abortSignal(signal);
  }

  const { data, error } = await request;

  if (error) {
    throw error;
  }

  return businessCategoryListSchema.parse(
    data ?? [],
  );
}

export async function onboardBusiness(
  values: BusinessOnboardingValues,
  requestKey: string,
) {
  const input =
    businessOnboardingSchema.parse(values);

  const response =
    await invokeAuthenticatedFunction<unknown>(
      "onboard-business",
      {
        ...input,
        requestKey,
        categoryId: input.categoryId || null,
      },
    );

  return onboardingResponseSchema.parse(response);
}