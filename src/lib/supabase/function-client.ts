import { getSupabaseClient } from "./client";

export class FunctionRequestError extends Error {
  readonly status: number | null;

  constructor(
    message: string,
    status: number | null = null,
  ) {
    super(message);

    this.name = "FunctionRequestError";
    this.status = status;
  }
}

function responseStatus(error: unknown): number | null {
  if (
    typeof error !== "object" ||
    error === null ||
    !("context" in error)
  ) {
    return null;
  }

  const context = error.context;

  if (context instanceof Response) {
    return context.status;
  }

  return null;
}

export async function invokeAuthenticatedFunction<
  TResponse,
>(
  name: string,
  body: Record<string, unknown>,
): Promise<TResponse> {
  const supabase = getSupabaseClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new FunctionRequestError(
      "Sign in before continuing.",
      401,
    );
  }

  const { data, error } =
    await supabase.functions.invoke<TResponse>(
      name,
      {
        body,

        headers: {
          Authorization:
            `Bearer ${session.access_token}`,
        },
      },
    );

  if (error) {
    const status = responseStatus(error);

    const message =
      status === 401
        ? "Your session has expired. Sign in again."
        : status === 403
          ? "You do not have permission for this action."
          : status === 409
            ? "The data has changed. Refresh and try again."
            : "Unable to complete this action. Please try again.";

    throw new FunctionRequestError(
      message,
      status,
    );
  }

  if (data === null || data === undefined) {
    throw new FunctionRequestError(
      "The server returned an empty response.",
    );
  }

  return data;
}