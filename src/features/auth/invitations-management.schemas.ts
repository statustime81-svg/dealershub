import { z } from "zod";

export const managedInvitationSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),

  target_role: z.enum([
    "dealer",
    "salesperson",
  ]),

  status: z.enum([
    "pending",
    "accepted",
    "revoked",
    "expired",
  ]),

  store_id: z.string().uuid().nullable(),

  expires_at: z.string(),
  created_at: z.string(),
});

export const managedInvitationListSchema =
  z.object({
    items: z.array(managedInvitationSchema),
    total: z.number().int().min(0),
    pageSize: z.number().int().positive(),
  });

export type ManagedInvitation = z.infer<
  typeof managedInvitationSchema
>;