import { handlePreflight } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
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
  }).strict(),

  z.object({
    action: z.literal("accept"),
    invitationId: uuidSchema,
    companyName: z
      .string()
      .trim()
      .max(200)
      .optional(),
  }).strict(),
]);

Deno.serve(async (request) => {
  const preflight = handlePreflight(request);

  if (preflight) {
    return preflight;
  }

  try {
    requirePost(request);

    const admin = createAdminClient();
    const user = await requireUser(request, admin);

    if (!user.email || !user.email_confirmed_at) {
      throw new HttpError(
        403,
        "Verify your account email before continuing.",
      );
    }

    const input = await parseBody(request, schema);

    if (input.action === "list") {
      const { data, error } = await admin
        .from("invitations")
        .select(
          "id, target_role, expires_at, business:businesses!inner(company_name, status)",
        )
        .eq("email", user.email.toLowerCase())
        .eq("status", "pending")
        .eq("business.status", "active")
        .gt("expires_at", new Date().toISOString())
        .or(
          `invited_user_id.is.null,invited_user_id.eq.${user.id}`,
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw new HttpError(
          500,
          "Unable to load invitations.",
        );
      }

      const rows = z.array(
        z.object({
          id: uuidSchema,
          target_role: z.enum([
            "dealer",
            "salesperson",
          ]),
          expires_at: z.string(),
          business: z.object({
            company_name: z.string(),
          }),
        }),
      ).parse(data ?? []);

      return jsonResponse({
        invitations: rows.map((row) => ({
          id: row.id,
          role: row.target_role,
          businessName: row.business.company_name,
          expiresAt: row.expires_at,
        })),
      });
    }

    const { data, error } = await admin.rpc(
      "accept_business_invitation",
      {
        p_user_id: user.id,
        p_invitation_id: input.invitationId,
        p_company_name: input.companyName || null,
      },
    );

    if (error) {
      throw new HttpError(
        409,
        "The invitation could not be accepted. Check your account, company name and invitation status.",
      );
    }

    return jsonResponse({
      success: true,
      result: data,
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
});