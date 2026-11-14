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

const imageSchema = z.object({
  id: uuidSchema,

  imagePath: z.string().min(1).max(500),

  altText: z.string().trim().max(300),
}).strict();

const schema = z.object({
  productId: uuidSchema,

  expectedImages: z.array(imageSchema),

  images: z.array(imageSchema),
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

    const { error } = await admin.rpc(
      "save_product_images",
      {
        p_actor_id: user.id,
        p_product_id: input.productId,
        p_expected_images: input.expectedImages,
        p_images: input.images,
      },
    );

    if (error) {
      throw new HttpError(
        409,
        "Images could not be saved. Refresh the gallery and check your product access.",
      );
    }

    return jsonResponse({
      success: true,
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
});