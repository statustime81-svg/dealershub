import { z } from "zod";

import { getSupabaseClient } from "@/lib/supabase/client";

import { invokeAuthenticatedFunction } from "@/lib/supabase/function-client";

import {
  dealerAssignmentSchema,
  salesTeamMutationResponseSchema,
  type DealerAssignmentValues,
} from "./sales-team.schemas";

const assignmentOptionsSchema = z.object({
  salespeople: z.array(
    z.object({
      userId: z.string().uuid(),
      name: z.string(),
    }),
  ),

  dealers: z.array(
    z.object({
      userId: z.string().uuid(),
      companyName: z.string(),
    }),
  ),
});

const salespersonWorkspaceSchema = z.object({
  person: z.object({
    userId: z.string().uuid(),
    name: z.string(),
    phone: z.string().nullable(),

    status: z.enum([
      "active",
      "inactive",
    ]),

    createdAt: z.string(),
  }),

  assignments: z.array(
    z.object({
      id: z.string().uuid(),
      dealerId: z.string().uuid(),
      companyName: z.string(),
      isActive: z.boolean(),
      hasStoreAccess: z.boolean(),
    }),
  ),

  orderCount: z.number().int().min(0),
});

export async function getAssignmentOptions(
  businessId: string,
  signal?: AbortSignal,
) {
  let request = getSupabaseClient().rpc(
    "get_assignment_options",
    {
      p_business_id: businessId,
    },
  );

  if (signal) {
    request = request.abortSignal(signal);
  }

  const { data, error } = await request;

  if (error) {
    throw error;
  }

  return assignmentOptionsSchema.parse(data);
}

export async function getSalespersonWorkspace(
  businessId: string,
  salespersonId: string,
  signal?: AbortSignal,
) {
  let request = getSupabaseClient().rpc(
    "get_salesperson_workspace",
    {
      p_business_id: businessId,
      p_salesperson_id: salespersonId,
    },
  );

  if (signal) {
    request = request.abortSignal(signal);
  }

  const { data, error } = await request;

  if (error) {
    throw error;
  }

  return salespersonWorkspaceSchema.parse(data);
}

export async function setDealerAssignment(
  values: DealerAssignmentValues,
) {
  const input =
    dealerAssignmentSchema.parse(values);

  const response =
    await invokeAuthenticatedFunction<unknown>(
      "assign-salesperson",
      input,
    );

  return salesTeamMutationResponseSchema.parse(
    response,
  );
}