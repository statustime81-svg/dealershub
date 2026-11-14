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

import { registerBusinessAccount } from "@/features/businesses/businesses.api";

import {
  registerAccountSchema,
  type RegisterAccountValues,
} from "@/features/businesses/businesses.schemas";

export default function RegisterBusinessPage() {
  const navigate = useNavigate();

  const { user, isConfigured } = useAuth();

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<RegisterAccountValues>({
    resolver: zodResolver(registerAccountSchema),

    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(
    values: RegisterAccountValues,
  ) {
    setError(null);

    try {
      const result =
        await registerBusinessAccount(values);

      reset();

      if (result.hasSession) {
        navigate(routes.onboarding, {
          replace: true,
        });
        return;
      }

      setSubmitted(true);
    } catch {
      setError(
        "Unable to register. Check your connection and password requirements. If you already have an account, sign in.",
      );
    }
  }

  if (user) {
    return (
      <section>
        <h2 className="text-2xl font-bold">
          You are signed in
        </h2>

        <Link
          to={routes.onboarding}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-info"
        >
          Continue to business setup
        </Link>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-2xl font-bold">
        Register your business
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted">
        Create your account first. Business and
        store details come next.
      </p>

      {submitted ? (
        <p
          role="status"
          className="mt-6 rounded-lg bg-green-50 p-4 text-sm leading-6 text-success"
        >
          If registration is eligible, check your
          email for verification instructions.
          Already registered? Sign in below.
        </p>
      ) : (
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4"
        >
          <Input
            {...register("fullName")}
            label="Full name"
            autoComplete="name"
            maxLength={150}
            required
            disabled={isSubmitting}
            error={errors.fullName?.message}
          />

          <Input
            {...register("email")}
            label="Email address"
            type="email"
            autoComplete="email"
            required
            disabled={isSubmitting}
            error={errors.email?.message}
          />

          <Input
            {...register("password")}
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            disabled={isSubmitting}
            error={errors.password?.message}
          />

          <Input
            {...register("confirmPassword")}
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
            disabled={isSubmitting}
            error={errors.confirmPassword?.message}
          />

          {!isConfigured && (
            <p
              role="alert"
              className="text-sm text-amber-800"
            >
              Configure Supabase before registering.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="text-sm text-danger"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!isConfigured}
            isLoading={isSubmitting}
            loadingText="Creating account…"
          >
            Create account
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link
          to={routes.auth.login}
          className="font-medium text-info hover:underline"
        >
          Sign in
        </Link>
      </p>
    </section>
  );
}