import { z } from "zod";

import { getSupabaseClient } from "@/lib/supabase/client";

import { invokeAuthenticatedFunction } from "@/lib/supabase/function-client";

import {
  dealerAccessSchema,
  dealerMutationResponseSchema,
  inviteDealerSchema,
  type DealerAccessValues,
  type InviteDealerValues,
} from "./dealers.schemas";

export const dealerAccessRowSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  store_id: z.string().uuid(),
  dealer_id: z.string().uuid(),

  status: z.enum([
    "pending",
    "active",
    "rejected",
    "inactive",
  ]),

  created_at: z.string(),

  dealer: z.object({
    user_id: z.string().uuid(),
    company_name: z.string(),
    contact_phone: z.string().nullable(),
    address: z.string().nullable(),
    gstin: z.string().nullable(),
  }),
});

export type DealerAccessRow = z.infer<
  typeof dealerAccessRowSchema
>;

export const DEALER_PAGE_SIZE = 12;

export interface DealerListInput {
  businessId: string;
  storeId: string;
  search: string;
  status: "all" | DealerAccessRow["status"];
  page: number;
}

const dealerSelection = `
  id,
  business_id,
  store_id,
  dealer_id,
  status,
  created_at,
  dealer:dealer_profiles!inner(
    user_id,
    company_name,
    contact_phone,
    address,
    gstin
  )
`;

function escapeLike(value: string): string {
  return value.replace(
    /[\\%_]/g,
    (character) => `\\${character}`,
  );
}

export async function getDealers(
  input: DealerListInput,
  signal?: AbortSignal,
) {
  z.string().uuid().parse(input.businessId);
  z.string().uuid().parse(input.storeId);
  z.number().int().positive().parse(input.page);

  const start =
    (input.page - 1) * DEALER_PAGE_SIZE;

  let request = getSupabaseClient()
    .from("dealer_store_access")
    .select(dealerSelection, {
      count: "exact",
    })
    .eq("business_id", input.businessId)
    .eq("store_id", input.storeId)
    .order("created_at", {
      ascending: false,
    })
    .order("id")
    .range(
      start,
      start + DEALER_PAGE_SIZE - 1,
    );

  if (input.search.trim()) {
    request = request.ilike(
      "dealer.company_name",
      `%${escapeLike(input.search.trim())}%`,
    );
  }

  if (input.status !== "all") {
    request = request.eq(
      "status",
      input.status,
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
    items: z.array(dealerAccessRowSchema)
      .parse(data ?? []),

    total: count ?? 0,
  };
}

export async function getDealerDetails(
  businessId: string,
  dealerId: string,
  signal?: AbortSignal,
) {
  const supabase = getSupabaseClient();

  let accessRequest = supabase
    .from("dealer_store_access")
    .select(dealerSelection)
    .eq("business_id", businessId)
    .eq("dealer_id", dealerId)
    .order("created_at");

  let orderRequest = supabase
    .from("orders")
    .select(
      "id, order_number, grand_total, status, created_at",
    )
    .eq("business_id", businessId)
    .eq("dealer_id", dealerId)
    .order("created_at", {
      ascending: false,
    })
    .order("id")
    .limit(20);

  if (signal) {
    accessRequest =
      accessRequest.abortSignal(signal);

    orderRequest =
      orderRequest.abortSignal(signal);
  }

  const [access, orders] = await Promise.all([
    accessRequest,
    orderRequest,
  ]);

  if (access.error) {
    throw access.error;
  }

  if (orders.error) {
    throw orders.error;
  }

  const accessRows = z.array(
    dealerAccessRowSchema,
  ).parse(access.data ?? []);

  if (!accessRows.length) {
    throw new Error(
      "Dealer is unavailable to this business.",
    );
  }

  const recentOrders = z.array(
    z.object({
      id: z.string().uuid(),
      order_number: z.number(),
      grand_total: z.number(),
      status: z.enum([
        "pending",
        "confirmed",
        "rejected",
        "processing",
        "dispatched",
        "delivered",
        "cancelled",
      ]),
      created_at: z.string(),
    }),
  ).parse(orders.data ?? []);

  return {
    dealer: accessRows[0].dealer,
    access: accessRows,
    recentOrders,
  };
}

export async function inviteDealer(
  values: InviteDealerValues,
) {
  const input = inviteDealerSchema.parse(values);

  const response =
    await invokeAuthenticatedFunction<unknown>(
      "invite-user",
      {
        ...input,
        role: "dealer",
      },
    );

  return z.object({
    success: z.literal(true),
    invitationId: z.string().uuid(),
    emailSent: z.boolean(),
    message: z.string(),
  }).parse(response);
}

export async function updateDealerAccess(
  values: DealerAccessValues,
) {
  const input = dealerAccessSchema.parse(values);

  const response =
    await invokeAuthenticatedFunction<unknown>(
      "manage-dealer-access",
      input,
    );

  return dealerMutationResponseSchema.parse(
    response,
  );
}