import { z } from "zod";

export const inviteSalespersonSchema = z.object({
  businessId: z.string().uuid(
    "Select a valid business.",
  ),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254)
    .transform((value) => value.toLowerCase()),
});

export const dealerAssignmentSchema = z.object({
  businessId: z.string().uuid(),

  salespersonId: z.string().uuid(
    "Select a salesperson.",
  ),

  dealerId: z.string().uuid(
    "Select a dealer.",
  ),

  active: z.boolean(),
});

export const salesTeamMutationResponseSchema =
  z.object({
    success: z.literal(true),
    message: z.string(),
  });

export type InviteSalespersonValues = z.infer<
  typeof inviteSalespersonSchema
>;

export type DealerAssignmentValues = z.infer<
  typeof dealerAssignmentSchema
>;