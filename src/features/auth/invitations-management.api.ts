import { z } from "zod";

import { invokeAuthenticatedFunction } from "@/lib/supabase/function-client";

import {
  managedInvitationListSchema,
} from "./invitations-management.schemas";

export async function getManagedInvitations(
  businessId: string,
  page: number,
) {
  const response =
    await invokeAuthenticatedFunction<unknown>(
      "manage-invitations",
      {
        action: "list",
        businessId,
        page,
      },
    );

  return managedInvitationListSchema.parse(
    response,
  );
}

export async function revokeManagedInvitation(
  businessId: string,
  invitationId: string,
) {
  const response =
    await invokeAuthenticatedFunction<unknown>(
      "manage-invitations",
      {
        action: "revoke",
        businessId,
        invitationId,
      },
    );

  return z.object({
    success: z.literal(true),
    message: z.string(),
  }).parse(response);
}