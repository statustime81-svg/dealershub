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
  storeId: uuidSchema,
  dealerId: uuidSchema,

  status: z.enum([
    "active",
    "rejected",
    "inactive",
  ]),
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
      "manage_dealer_store_access",
      {
        p_actor_id: user.id,
        p_business_id: input.businessId,
        p_store_id: input.storeId,
        p_dealer_id: input.dealerId,
        p_status: input.status,
      },
    );

    if (error) {
      throw new HttpError(
        409,
        "Dealer access could not be updated. Refresh the dealer record and try again.",
      );
    }

    return jsonResponse({
      success: true,
      message: "Dealer access updated.",
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
});