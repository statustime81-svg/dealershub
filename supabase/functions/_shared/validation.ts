import { z } from "npm:zod@3.24.2";

import { HttpError } from "./responses.ts";

export { z };

export const uuidSchema = z.string().uuid();

export const emailSchema = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export async function parseBody<
  TSchema extends z.ZodTypeAny,
>(
  request: Request,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  const contentType =
    request.headers.get("Content-Type") ?? "";

  if (
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    throw new HttpError(
      415,
      "Send the request as application/json.",
    );
  }

  const text = await request.text();

  if (new TextEncoder().encode(text).byteLength > 32_768) {
    throw new HttpError(
      413,
      "The request is too large.",
    );
  }

  let body: unknown;

  try {
    body = JSON.parse(text);
  } catch {
    throw new HttpError(
      400,
      "The request contains invalid JSON.",
    );
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    throw new HttpError(
      400,
      result.error.issues[0]?.message ??
        "Check the submitted information.",
    );
  }

  return result.data;
}