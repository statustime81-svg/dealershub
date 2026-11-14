import { handlePreflight } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { requireBusinessAdmin } from "../_shared/permissions.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

import {
  errorResponse,
  HttpError,
  jsonResponse,
  requirePost,
} from "../_shared/responses.ts";

import {
  parseBody,
  uuidSchema,
  z,
} from "../_shared/validation.ts";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("list"),
    businessId: uuidSchema,
    page: z.number().int().positive().max(100000),
  }).strict(),

  z.object({
    action: z.literal("revoke"),
    businessId: uuidSchema,
    invitationId: uuidSchema,
  }).strict(),
]);

Deno.serve(async (request) => {
  const preflight = handlePreflight(request);

  if (preflight) return preflight;

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

    if (input.action === "list") {
      const pageSize = 15;
      const start = (input.page - 1) * pageSize;

      const { data, error, count } = await admin
        .from("invitations")
        .select(
          "id, email, target_role, status, store_id, expires_at, created_at",
          { count: "exact" },
        )
        .eq("business_id", input.businessId)
        .order("created_at", { ascending: false })
        .order("id")
        .range(start, start + pageSize - 1);

      if (error) {
        throw new HttpError(
          500,
          "Invitations could not load.",
        );
      }

      return jsonResponse({
        items: data ?? [],
        total: count ?? 0,
        pageSize,
      });
    }

    const { error } = await admin.rpc(
      "revoke_business_invitation",
      {
        p_actor_id: user.id,
        p_business_id: input.businessId,
        p_invitation_id: input.invitationId,
      },
    );

    if (error) {
      throw new HttpError(
        409,
        "Invitation changed or cannot be revoked.",
      );
    }

    return jsonResponse({
      success: true,
      message: "Invitation status updated.",
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
});