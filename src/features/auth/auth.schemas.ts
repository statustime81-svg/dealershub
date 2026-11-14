import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.");

export const loginSchema = z.object({
  email: emailSchema,

  password: z
    .string()
    .min(1, "Enter your password."),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(
        8,
        "Use at least 8 characters.",
      ),

    confirmPassword: z
      .string()
      .min(1, "Confirm your password."),
  })
  .refine(
    (values) =>
      values.password === values.confirmPassword,
    {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    },
  );

export type LoginValues = z.infer<
  typeof loginSchema
>;

export type ForgotPasswordValues = z.infer<
  typeof forgotPasswordSchema
>;

export type ResetPasswordValues = z.infer<
  typeof resetPasswordSchema
>;