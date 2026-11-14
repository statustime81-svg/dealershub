import { routes } from "@/config/routes";

import { getSupabaseClient } from "@/lib/supabase/client";

import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  type ForgotPasswordValues,
  type LoginValues,
  type ResetPasswordValues,
} from "./auth.schemas";

export async function signIn(
  values: LoginValues,
) {
  const input = loginSchema.parse(values);

  const supabase = getSupabaseClient();

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signOut({
    scope: "local",
  });

  if (error) {
    throw error;
  }
}

export async function requestPasswordReset(
  values: ForgotPasswordValues,
): Promise<void> {
  const input = forgotPasswordSchema.parse(values);

  const redirectTo = new URL(
    routes.auth.resetPassword,
    window.location.origin,
  ).toString();

  const supabase = getSupabaseClient();

  const { error } =
    await supabase.auth.resetPasswordForEmail(
      input.email,
      {
        redirectTo,
      },
    );

  if (error) {
    throw error;
  }
}

export async function updatePassword(
  values: ResetPasswordValues,
): Promise<void> {
  const input = resetPasswordSchema.parse(values);

  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.updateUser({
    password: input.password,
  });

  if (error) {
    throw error;
  }
}