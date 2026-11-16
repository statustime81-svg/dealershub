import { handlePreflight } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";
import { errorResponse, HttpError, jsonResponse, requirePost } from "../_shared/responses.ts";
import { parseBody, uuidSchema, z } from "../_shared/validation.ts";
const schema = z.object({
  plan: z.enum(["advance50","credit30","credit60","credit90"]),
  address: z.object({name:z.string().trim().min(1).max(200),phone:z.string().trim().min(6).max(40),address:z.string().trim().min(5).max(2000)}).strict(),
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
    const { data, error } = await admin.rpc("submit_order_checkout", {
      p_actor_id: user.id, p_cart_id: input.cartId,p_plan:input.plan,p_address:input.address,
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
