import { handlePreflight } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";
import { errorResponse, HttpError, jsonResponse, requirePost } from "../_shared/responses.ts";
import { parseBody, uuidSchema, z } from "../_shared/validation.ts";
const statuses = z.enum(["pending", "confirmed", "rejected", "processing", "dispatched", "delivered", "cancelled"]);
const schema = z.object({
  orderId: uuidSchema, expectedStatus: statuses,
  expectedUpdatedAt: z.string().datetime({ offset: true }),
  newStatus: statuses, requestKey: uuidSchema, note: z.string().trim().max(2000),
}).strict();
Deno.serve(async (request) => {
  const preflight = handlePreflight(request); if (preflight) return preflight;
  try {
    requirePost(request);
    const admin = createAdminClient(); const user = await requireUser(request, admin);
    const input = await parseBody(request, schema);
    const { data, error } = await admin.rpc("change_manufacturer_order_status", {
      p_actor_id: user.id, p_order_id: input.orderId,
      p_expected_status: input.expectedStatus, p_expected_updated_at: input.expectedUpdatedAt,
      p_new_status: input.newStatus, p_request_key: input.requestKey, p_note: input.note,
    });
    if (error) {
      if (error.code === "42501") throw new HttpError(403, "You cannot manage this order.");
      if (error.message.includes("DH_STATUS_STOCK_POLICY_NOT_CONFIGURED")) throw new HttpError(409, "Order status changes await confirmation of stock handling rules.");
      throw new HttpError(409, "Order changed or this transition is unavailable. Refresh the order.");
    }
    const result = z.object({ orderId: uuidSchema, status: statuses, alreadyUpdated: z.boolean() }).parse(data);
    return jsonResponse({ success: true, ...result });
  } catch (error: unknown) { return errorResponse(error); }
});
