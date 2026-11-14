import { useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Link,
  useLocation,
} from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

import { routes } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";

import { updatePassword } from "../auth.api";

import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "../auth.schemas";

export default function ResetPasswordPage() {
  const location = useLocation();

  const {
    user,
    isLoading,
    isConfigured,
    error: sessionError,
  } = useAuth();

  const [saved, setSaved] = useState(false);

  const [formError, setFormError] =
    useState<string | null>(null);

  const query = new URLSearchParams(location.search);

  const hash = new URLSearchParams(
    location.hash.replace(/^#/, ""),
  );

  const hasLinkError =
    query.has("error") ||
    query.has("error_code") ||
    hash.has("error") ||
    hash.has("error_code");

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(
    values: ResetPasswordValues,
  ): Promise<void> {
    setFormError(null);

    if (!user || hasLinkError) {
      setFormError(
        "Request a new reset link before continuing.",
      );
      return;
    }

    try {
      await updatePassword(values);
      reset();
      setSaved(true);
    } catch (error: unknown) {
      setFormError(
        getErrorMessage(
          error,
          "Unable to update your password. The session may have expired or the password may not meet account requirements.",
        ),
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-8">
        <Spinner label="Checking reset session" />

        <p className="text-sm text-muted">
          Checking your reset session…
        </p>
      </div>
    );
  }

  if (
    !isConfigured ||
    !user ||
    hasLinkError ||
    sessionError
  ) {
    return (
      <section>
        <h2 className="text-2xl font-bold">
          Reset link unavailable
        </h2>

        <p
          role="alert"
          className="mt-3 text-sm leading-6 text-muted"
        >
          This page needs a valid session. Request
          a new reset link and open it in the same
          browser where you requested it.
        </p>

        <Link
          to={routes.auth.forgotPassword}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-info hover:underline"
        >
          Request a new link
        </Link>
      </section>
    );
  }

  if (saved) {
    return (
      <section>
        <h2 className="text-2xl font-bold">
          Password updated
        </h2>

        <p
          role="status"
          className="mt-3 text-sm leading-6 text-success"
        >
          Your new password has been saved.
          Your current session remains signed in.
        </p>

        <Link
          to={routes.public.home}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-info hover:underline"
        >
          Continue to DealersHub
        </Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="reset-heading">
      <h2
        id="reset-heading"
        className="text-2xl font-bold tracking-tight"
      >
        Choose a new password
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted">
        Use at least 8 characters. Additional account
        password requirements may apply.
      </p>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-5"
      >
        <Input
          {...register("password")}
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
          error={errors.password?.message}
        />

        <Input
          {...register("confirmPassword")}
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
          error={errors.confirmPassword?.message}
        />

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
          loadingText="Saving password…"
        >
          Save new password
        </Button>
      </form>
    </section>
  );
} 