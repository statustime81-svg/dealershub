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
  emailSchema,
  parseBody,
  slugSchema,
  uuidSchema,
  z,
} from "../_shared/validation.ts";

const schema = z.object({
  requestKey: uuidSchema,

  businessType: z.enum([
    "manufacturer",
    "distributor",
  ]),

  companyName: z.string().trim().min(1).max(200),

  contactEmail: emailSchema,

  contactPhone: z
    .string()
    .trim()
    .max(40)
    .nullable()
    .optional(),

  address: z
    .string()
    .trim()
    .max(1000)
    .nullable()
    .optional(),

  gstin: z
    .string()
    .trim()
    .max(30)
    .nullable()
    .optional(),

  categoryId: uuidSchema.nullable().optional(),

  storeName: z.string().trim().min(1).max(200),

  storeSlug: slugSchema,
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

    if (!user.email_confirmed_at) {
      throw new HttpError(
        403,
        "Verify your email before creating a business.",
      );
    }

    const input = await parseBody(request, schema);

    const { data, error } = await admin.rpc(
      "onboard_business",
      {
        p_user_id: user.id,
        p_request_key: input.requestKey,
        p_business_type: input.businessType,
        p_company_name: input.companyName,
        p_contact_email: input.contactEmail,
        p_contact_phone: input.contactPhone || null,
        p_address: input.address || null,
        p_gstin: input.gstin || null,
        p_category_id: input.categoryId ?? null,
        p_store_name: input.storeName,
        p_store_slug: input.storeSlug,
      },
    );

    if (error) {
      if (error.code === "23505") {
        throw new HttpError(
          409,
          "This store address is already in use. Choose another.",
        );
      }

      throw new HttpError(
        500,
        "Unable to create the business.",
      );
    }

    const result = z.object({
      businessId: uuidSchema,
      storeId: uuidSchema,
      alreadyCreated: z.boolean(),
    }).parse(data);

    return jsonResponse({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
});