import { useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { routes } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";

import { requestPasswordReset } from "../auth.api";

import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "../auth.schemas";

export default function ForgotPasswordPage() {
  const { isConfigured } = useAuth();

  const [submitted, setSubmitted] = useState(false);

  const [formError, setFormError] =
    useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(
    values: ForgotPasswordValues,
  ): Promise<void> {
    setFormError(null);

    try {
      await requestPasswordReset(values);
      setSubmitted(true);
    } catch (error: unknown) {
      setFormError(
        getErrorMessage(
          error,
          "Unable to request a reset link. Please try again.",
        ),
      );
    }
  }

  return (
    <section aria-labelledby="forgot-heading">
      <h2
        id="forgot-heading"
        className="text-2xl font-bold tracking-tight"
      >
        Reset your password
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted">
        Enter your account email to request a reset link.
      </p>

      {submitted ? (
        <div
          role="status"
          className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm leading-6 text-success"
        >
          If an eligible account exists for that
          email, you will receive password reset
          instructions. Check your inbox and spam folder.
        </div>
      ) : (
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-5"
        >
          <Input
            {...register("email")}
            label="Email address"
            type="email"
            autoComplete="email"
            required
            disabled={isSubmitting}
            error={errors.email?.message}
          />

          {!isConfigured && (
            <p
              role="alert"
              className="text-sm text-amber-800"
            >
              Configure Supabase before requesting
              a password reset.
            </p>
          )}

          {formError && (
            <p
              role="alert"
              className="text-sm text-danger"
            >
              {formError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            isLoading={isSubmitting}
            loadingText="Sending request…"
            disabled={!isConfigured}
          >
            Send reset link
          </Button>
        </form>
      )}

      <Link
        to={routes.auth.login}
        className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-info hover:underline"
      >
        Back to sign in
      </Link>
    </section>
  );
}