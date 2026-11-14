import { handlePreflight } from "../_shared/cors.ts";

import { requireUser } from "../_shared/auth.ts";

import {
  requireBusinessAdmin,
  requireBusinessStore,
} from "../_shared/permissions.ts";

import { createAdminClient } from "../_shared/supabase-admin.ts";

import {
  errorResponse,
  HttpError,
  jsonResponse,
  requirePost,
} from "../_shared/responses.ts";

import {
  emailSchema,
  parseBody,
  uuidSchema,
  z,
} from "../_shared/validation.ts";

const schema = z.discriminatedUnion("role", [
  z.object({
    businessId: uuidSchema,
    storeId: uuidSchema,
    email: emailSchema,
    role: z.literal("dealer"),
  }).strict(),

  z.object({
    businessId: uuidSchema,
    email: emailSchema,
    role: z.literal("salesperson"),
  }).strict(),
]);

function invitationRedirectUrl(): string {
  const configured = Deno.env.get("APP_URL");

  if (!configured) {
    throw new HttpError(
      500,
      "The invitation destination is not configured.",
    );
  }

  let url: URL;

  try {
    url = new URL(configured);
  } catch {
    throw new HttpError(
      500,
      "The invitation destination is invalid.",
    );
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new HttpError(
      500,
      "The invitation destination is invalid.",
    );
  }

  return new URL(
    "/accept-invitation",
    url.origin,
  ).toString();
}

Deno.serve(async (request) => {
  const preflight = handlePreflight(request);

  if (preflight) {
    return preflight;
  }

  try {
    requirePost(request);

    const admin = createAdminClient();

    const user = await requireUser(request, admin);

    const input = await parseBody(request, schema);

    await requireBusinessAdmin(
      admin,
      user.id,
      input.businessId,
    );

    const storeId =
      input.role === "dealer"
        ? input.storeId
        : null;

    if (storeId) {
      await requireBusinessStore(
        admin,
        input.businessId,
        storeId,
      );
    }

    const redirectTo = invitationRedirectUrl();

    // Expire old invitations before checking for duplicates.
    const { error: expirationError } = await admin
      .from("invitations")
      .update({
        status: "expired",
      })
      .eq("business_id", input.businessId)
      .eq("email", input.email)
      .eq("status", "pending")
      .lte("expires_at", new Date().toISOString());

    if (expirationError) {
      throw new HttpError(
        500,
        "Unable to prepare the invitation.",
      );
    }

    const {
      data: existingUserId,
      error: lookupError,
    } = await admin.rpc(
      "find_invitation_user",
      {
        p_email: input.email,
      },
    );

    if (lookupError) {
      throw new HttpError(
        500,
        "Unable to prepare the invitation.",
      );
    }

    // Use the configured Auth invitation lifetime.
    // This does not invent a separate business invitation period.
    const lifetimeSeconds = Number(
      Deno.env.get("INVITATION_TTL_SECONDS"),
    );

    if (
      !Number.isSafeInteger(lifetimeSeconds) ||
      lifetimeSeconds <= 0
    ) {
      throw new HttpError(
        500,
        "The invitation lifetime is not configured.",
      );
    }

    const expiresAt = new Date(
      Date.now() + lifetimeSeconds * 1000,
    ).toISOString();

    const {
      data: invitation,
      error: insertError,
    } = await admin
      .from("invitations")
      .insert({
        business_id: input.businessId,
        store_id: storeId,
        email: input.email,
        target_role: input.role,
        invited_user_id: existingUserId ?? null,
        invited_by: user.id,
        status: "pending",
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (insertError || !invitation) {
      if (insertError?.code === "23505") {
        throw new HttpError(
          409,
          "A pending invitation already exists.",
        );
      }

      throw new HttpError(
        500,
        "Unable to create the invitation.",
      );
    }

    if (existingUserId) {
      return jsonResponse({
        success: true,
        invitationId: invitation.id,
        emailSent: false,
        message:
          "Invitation created. The existing account must sign in and accept it.",
      });
    }

    const {
      data: invited,
      error: inviteError,
    } = await admin.auth.admin.inviteUserByEmail(
      input.email,
      {
        redirectTo,
      },
    );

    if (inviteError || !invited.user) {
      const { error: revokeError } = await admin
        .from("invitations")
        .update({
          status: "revoked",
        })
        .eq("id", invitation.id)
        .eq("status", "pending");

      if (revokeError) {
        throw new HttpError(
          500,
          "Delivery failed and invitation cleanup needs administrator review.",
        );
      }

      throw new HttpError(
        502,
        "The invitation email could not be sent. Try again later.",
      );
    }

    const { error: linkError } = await admin
      .from("invitations")
      .update({
        invited_user_id: invited.user.id,
      })
      .eq("id", invitation.id)
      .eq("status", "pending");

    if (linkError) {
      throw new HttpError(
        500,
        "The email was sent, but invitation synchronization failed. Do not resend immediately.",
      );
    }

    return jsonResponse({
      success: true,
      invitationId: invitation.id,
      emailSent: true,
      message:
        "Invitation submitted to the email service.",
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
});