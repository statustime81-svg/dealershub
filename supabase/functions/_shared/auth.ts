import type { User } from "npm:@supabase/supabase-js@2";

import type { AdminClient } from "./supabase-admin.ts";

import { HttpError } from "./responses.ts";

export async function requireUser(
  request: Request,
  admin: AdminClient,
): Promise<User> {
  const authorization =
    request.headers.get("Authorization");

  const match = authorization?.match(
    /^Bearer\s+(\S+)$/i,
  );

  const accessToken = match?.[1];

  if (!accessToken) {
    throw new HttpError(
      401,
      "Sign in before continuing.",
    );
  }

  const {
    data: { user },
    error,
  } = await admin.auth.getUser(accessToken);

  if (error || !user) {
    throw new HttpError(
      401,
      "Your session is invalid or expired.",
    );
  }

  return user;
}