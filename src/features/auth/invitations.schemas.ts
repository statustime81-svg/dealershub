import { z } from "zod";

export const pendingInvitationSchema = z.object({
  id: z.string().uuid(),

  role: z.enum([
    "dealer",
    "salesperson",
  ]),

  businessName: z.string(),

  expiresAt: z.string().datetime({
    offset: true,
  }),
});

export const invitationListSchema = z.object({
  invitations: z.array(
    pendingInvitationSchema,
  ),
});

export const acceptInvitationResponseSchema =
  z.object({
    success: z.literal(true),

    result: z.object({
      invitationId: z.string().uuid(),

      role: z.enum([
        "dealer",
        "salesperson",
      ]),

      alreadyAccepted: z.boolean(),
    }),
  });

export type PendingInvitation = z.infer<
  typeof pendingInvitationSchema
>;