import { handlePreflight } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";
import { errorResponse, HttpError, jsonResponse, requirePost } from "../_shared/responses.ts";
import { parseBody, uuidSchema, z } from "../_shared/validation.ts";
const schema = z.object({
  cartId: uuidSchema, idempotencyKey: uuidSchema,
  fingerprint: z.string().regex(/^[a-f0-9]{32}$/),
}).strict();
Deno.serve(async (request) => {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  try {
    requirePost(request);
    const admin = createAdminClient();
    const user = await requireUser(request, admin);
    const input = await parseBody(request, schema);
    const { data, error } = await admin.rpc("submit_cart_order", {
      p_actor_id: user.id, p_cart_id: input.cartId,
      p_idempotency_key: input.idempotencyKey, p_expected_fingerprint: input.fingerprint,
    });
    if (error) {
      if (error.message.includes("DH_PRICING_NOT_CONFIGURED") || error.message.includes("DH_STOCK_POLICY_NOT_CONFIGURED")) {
        throw new HttpError(409, "Order terms are awaiting business confirmation.");
      }
      if (error.code === "42501") throw new HttpError(403, "Cart access is unavailable.");
      throw new HttpError(409, "Cart, pricing or availability changed. Review checkout before retrying.");
    }
    const result = z.object({ orderId: uuidSchema, orderNumber: z.number(), alreadySubmitted: z.boolean() }).parse(data);
    return jsonResponse({ success: true, ...result });
  } catch (error: unknown) { return errorResponse(error); }
});
