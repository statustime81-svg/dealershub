import { invokeAuthenticatedFunction } from "@/lib/supabase/function-client";

import {
  acceptInvitationResponseSchema,
  invitationListSchema,
} from "./invitations.schemas";

export async function getPendingInvitations() {
  const response =
    await invokeAuthenticatedFunction<unknown>(
      "accept-invitation",
      {
        action: "list",
      },
    );

  return invitationListSchema
    .parse(response)
    .invitations;
}

export async function acceptInvitation(
  invitationId: string,
  companyName?: string,
) {
  const response =
    await invokeAuthenticatedFunction<unknown>(
      "accept-invitation",
      {
        action: "accept",
        invitationId,
        companyName,
      },
    );

  return acceptInvitationResponseSchema.parse(
    response,
  );
}