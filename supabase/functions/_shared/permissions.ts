import type { AdminClient } from "./supabase-admin.ts";

import { HttpError } from "./responses.ts";

export async function requireBusinessAdmin(
  admin: AdminClient,
  userId: string,
  businessId: string,
): Promise<void> {
  const {
    data: business,
    error: businessError,
  } = await admin
    .from("businesses")
    .select("id, status")
    .eq("id", businessId)
    .maybeSingle();

  if (businessError) {
    throw new HttpError(
      500,
      "Unable to verify business access.",
    );
  }

  if (!business || business.status !== "active") {
    throw new HttpError(
      403,
      "This business is unavailable.",
    );
  }

  const {
    data: membership,
    error: membershipError,
  } = await admin
    .from("business_memberships")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .eq("role", "business_admin")
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) {
    throw new HttpError(
      500,
      "Unable to verify business permissions.",
    );
  }

  if (!membership) {
    throw new HttpError(
      403,
      "You cannot manage this business.",
    );
  }
}

export async function requireBusinessStore(
  admin: AdminClient,
  businessId: string,
  storeId: string,
): Promise<void> {
  const { data, error } = await admin
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw new HttpError(
      500,
      "Unable to verify store ownership.",
    );
  }

  if (!data) {
    throw new HttpError(
      403,
      "This store does not belong to the business.",
    );
  }
}