import { useState } from "react";

import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import {
  inviteSalesperson,
} from "../sales-team.api";

export function InviteSalespersonForm({
  businessId,
}: {
  businessId: string;
}) {
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
    setError(null);
    setMessage(null);

    try {
      const result = await inviteSalesperson({
        businessId,
        email: values.email,
      });

      setMessage(
        result.emailSent
          ? "Invitation submitted to the email service."
          : "Invitation created. The existing account can sign in and accept it.",
      );

      reset();
    } catch {
      setError(
        "Invitation could not be created. Check the email, existing invitations and backend setup.",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="space-y-4 rounded-xl border border-border bg-surface p-5"
    >
      <h2 className="text-lg font-semibold">
        Invite salesperson
      </h2>

      <Input
        {...register("email", {
          required: "Enter an email address.",
        })}
        label="Salesperson email"
        type="email"
        autoComplete="email"
        maxLength={254}
        required
        disabled={isSubmitting}
        error={errors.email?.message}
      />

      {message && (
        <p role="status" className="text-sm text-success">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
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