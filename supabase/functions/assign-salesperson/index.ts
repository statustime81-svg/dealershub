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

const schema = z.object({
  businessId: uuidSchema,
  salespersonId: uuidSchema,
  dealerId: uuidSchema,
  active: z.boolean(),
}).strict();

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

    const { error } = await admin.rpc(
      "set_salesperson_assignment",
      {
        p_actor_id: user.id,
        p_business_id: input.businessId,
        p_salesperson_id: input.salespersonId,
        p_dealer_id: input.dealerId,
        p_active: input.active,
      },
    );

    if (error) {
      throw new HttpError(
        409,
        "Assignment could not be updated. Check the salesperson membership and dealer access.",
      );
    }

    return jsonResponse({
      success: true,

      message: input.active
        ? "Dealer assigned."
        : "Assignment deactivated.",
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
});