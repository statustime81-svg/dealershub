import { useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { routes } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";

import { signIn } from "../auth.api";

import {
  loginSchema,
  type LoginValues,
} from "../auth.schemas";

export default function LoginPage() {
  const navigate = useNavigate();

  const {
    user,
    isConfigured,
  } = useAuth();

  const [formError, setFormError] =
    useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(
    values: LoginValues,
  ): Promise<void> {
    setFormError(null);

    try {
      await signIn(values);

      navigate(routes.onboarding, {
        replace: true,
      });
    } catch (error: unknown) {
      setFormError(
        getErrorMessage(
          error,
          "Unable to sign in. Check your connection and try again.",
        ),
      );
    }
  }

  if (user) {
    return (
      <section>
        <h2 className="text-2xl font-bold">
          You are signed in
        </h2>

        <p className="mt-2 break-all text-sm text-muted">
          {user.email}
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <Link
            to={routes.onboarding}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-lime px-4 text-sm font-semibold text-midnight"
          >
            Continue to your account
          </Link>

          <Link
            to={routes.auth.acceptInvitation}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium"
          >
            View invitations
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="login-heading">
      <h2
        id="login-heading"
        className="text-2xl font-bold tracking-tight"
      >
        Welcome back
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted">
        Sign in with your DealersHub account.
      </p>

      {!isConfigured && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          Add your Supabase URL and publishable or
          anon key to .env.local, then restart
          the development server.
        </div>
      )}

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-5"
      >
        <Input
          {...register("email")}
          label="Email address"
          type="email"
          autoComplete="username"
          required
          disabled={isSubmitting}
          error={errors.email?.message}
        />

        <Input
          {...register("password")}
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isSubmitting}
          error={errors.password?.message}
        />

        <div className="flex justify-end">
          <Link
            to={routes.auth.forgotPassword}
            className="text-sm font-medium text-info hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-danger"
          >
            {formError}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting}
          loadingText="Signing in…"
          disabled={!isConfigured}
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Manufacturer or distributor?{" "}
        <Link
          to={routes.auth.register}
          className="font-medium text-info hover:underline"
        >
          Register your business
        </Link>
      </p>

      <p className="mt-3 text-xs leading-5 text-muted">
        Dealers and salespeople should use their
        business invitation.
      </p>
    </section>
  );
}