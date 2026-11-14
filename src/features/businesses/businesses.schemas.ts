import { z } from "zod";

export const registerAccountSchema = z
  .object({
    fullName: z.string().trim().min(
      1,
      "Enter your full name.",
    ).max(150),

    email: z.string().trim().email(
      "Enter a valid email address.",
    ).max(254),

    password: z.string().min(
      8,
      "Use at least 8 characters.",
    ),

    confirmPassword: z.string(),
  })
  .refine(
    (value) =>
      value.password === value.confirmPassword,
    {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    },
  );

export const businessOnboardingSchema = z.object({
  businessType: z.enum([
    "manufacturer",
    "distributor",
  ]),

  companyName: z.string().trim().min(
    1,
    "Enter your company name.",
  ).max(200),

  contactEmail: z.string().trim().email(
    "Enter a valid email address.",
  ).max(254),

  contactPhone: z.string().trim().max(40),

  address: z.string().trim().max(1000),

  gstin: z.string().trim().max(30),

  categoryId: z.union([
    z.literal(""),
    z.string().uuid(),
  ]),

  storeName: z.string().trim().min(
    1,
    "Enter your store name.",
  ).max(200),

  storeSlug: z.string().trim().min(
    1,
    "Enter your store URL name.",
  ).max(100).regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens.",
  ),
});

export const onboardingResponseSchema = z.object({
  success: z.literal(true),
  businessId: z.string().uuid(),
  storeId: z.string().uuid(),
  alreadyCreated: z.boolean(),
});

export const businessCategoryListSchema = z.array(
  z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
);

export const membershipListSchema = z.array(
  z.object({
    id: z.string().uuid(),
    business_id: z.string().uuid(),
    user_id: z.string().uuid(),

    role: z.enum([
      "business_admin",
      "salesperson",
    ]),

    status: z.enum([
      "active",
      "inactive",
    ]),

    business: z.object({
      company_name: z.string(),
      business_type: z.enum([
        "manufacturer",
        "distributor",
      ]),
      status: z.enum([
        "active",
        "suspended",
      ]),
    }),
  }),
);

export type RegisterAccountValues = z.infer<
  typeof registerAccountSchema
>;

export type BusinessOnboardingValues = z.infer<
  typeof businessOnboardingSchema
>;

export type VerifiedBusinessMembership =
  z.infer<typeof membershipListSchema>[number];