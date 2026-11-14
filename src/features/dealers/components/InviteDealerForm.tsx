import { useState } from "react";

import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { inviteDealer } from "../dealers.api";

interface InviteDealerFormProps {
  businessId: string;
  storeId: string;
}

export function InviteDealerForm({
  businessId,
  storeId,
}: InviteDealerFormProps) {
  const [message, setMessage] =
    useState<string | null>(null);

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
  } = useForm<{ email: string }>({
    defaultValues: {
      email: "",
    },
  });

  async function submit(values: {
    email: string;
  }) {
    setMessage(null);
    setError(null);

    try {
      const result = await inviteDealer({
        businessId,
        storeId,
        email: values.email,
      });

      setMessage(
        result.emailSent
          ? "Invitation submitted to the email service."
          : "Invitation created. The existing account can sign in and open Business invitations.",
      );

      reset();
    } catch {
      setError(
        "Invitation could not be created. Check the email, pending invitations and backend configuration.",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="space-y-4 rounded-xl border border-border bg-surface p-5"
    >
      <h2 className="text-lg font-semibold">
        Invite dealer
      </h2>

      <Input
        {...register("email", {
          required: "Enter an email address.",
        })}
        label="Dealer email"
        type="email"
        autoComplete="email"
        maxLength={254}
        required
        disabled={isSubmitting}
        error={errors.email?.message}
      />

      <p className="text-xs leading-5 text-muted">
        Store access becomes active after the
        invitation is accepted.
      </p>

      {message && (
        <p
          role="status"
          className="text-sm text-success"
        >
          {message}
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
        isLoading={isSubmitting}
        loadingText="Creating invitation…"
      >
        Send invitation
      </Button>
    </form>
  );
}