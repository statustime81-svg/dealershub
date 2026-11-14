import { z } from "zod";

import { getSupabaseClient } from "@/lib/supabase/client";

import { invokeAuthenticatedFunction } from "@/lib/supabase/function-client";

import {
  inviteSalespersonSchema,
  type InviteSalespersonValues,
} from "./sales-team.schemas";

export const salespersonRowSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  user_id: z.string().uuid(),

  role: z.literal("salesperson"),

  status: z.enum([
    "active",
    "inactive",
  ]),

  created_at: z.string(),

  profile: z.object({
    full_name: z.string(),
    phone: z.string().nullable(),
  }),
});

export type SalespersonRow = z.infer<
  typeof salespersonRowSchema
>;

export const SALES_TEAM_PAGE_SIZE = 12;

export async function getSalesTeam(
  businessId: string,
  page: number,
  search: string,
  signal?: AbortSignal,
) {
  const start =
    (page - 1) * SALES_TEAM_PAGE_SIZE;

  let request = getSupabaseClient()
    .from("business_memberships")
    .select(
      `
        id,
        business_id,
        user_id,
        role,
        status,
        created_at,
        profile:profiles!inner(full_name, phone)
      `,
      { count: "exact" },
    )
    .eq("business_id", businessId)
    .eq("role", "salesperson")
    .order("created_at", {
      ascending: false,
    })
    .order("id")
    .range(
      start,
      start + SALES_TEAM_PAGE_SIZE - 1,
    );

  if (search.trim()) {
    const escaped = search.trim().replace(
      /[\\%_]/g,
      (character) => `\\${character}`,
    );

    request = request.ilike(
      "profile.full_name",
      `%${escaped}%`,
    );
  }

  if (signal) {
    request = request.abortSignal(signal);
  }

  const { data, error, count } = await request;

  if (error) {
    throw error;
  }

  return {
    items: z.array(salespersonRowSchema)
      .parse(data ?? []),

    total: count ?? 0,
  };
}

export async function inviteSalesperson(
  values: InviteSalespersonValues,
) {
  const input =
    inviteSalespersonSchema.parse(values);

  const response =
    await invokeAuthenticatedFunction<unknown>(
      "invite-user",
      {
        ...input,
        role: "salesperson",
      },
    );

  return z.object({
    success: z.literal(true),
    invitationId: z.string().uuid(),
    emailSent: z.boolean(),
    message: z.string(),
  }).parse(response);
}