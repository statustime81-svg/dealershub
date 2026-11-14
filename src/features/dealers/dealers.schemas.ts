import { z } from "zod";

export const inviteDealerSchema = z.object({
  businessId: z.string().uuid(
    "Select a valid business.",
  ),

  storeId: z.string().uuid(
    "Select a valid store.",
  ),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254)
    .transform((value) => value.toLowerCase()),
});

export const dealerAccessSchema = z.object({
  businessId: z.string().uuid(),
  storeId: z.string().uuid(),
  dealerId: z.string().uuid(),

  status: z.enum([
    "active",
    "rejected",
    "inactive",
  ]),
});

export const dealerMutationResponseSchema =
  z.object({
    success: z.literal(true),
    message: z.string(),
  });

export type InviteDealerValues = z.infer<
  typeof inviteDealerSchema
>;

export type DealerAccessValues = z.infer<
  typeof dealerAccessSchema
>;