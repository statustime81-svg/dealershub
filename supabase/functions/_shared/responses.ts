import { corsHeaders } from "./cors.ts";

export class HttpError extends Error {
  readonly status: number;

  constructor(
    status: number,
    message: string,
  ) {
    super(message);

    this.name = "HttpError";
    this.status = status;
  }
}

export function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,

      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}

export function errorResponse(
  error: unknown,
): Response {
  if (error instanceof HttpError) {
    return jsonResponse(
      {
        success: false,
        message: error.message,
      },
      error.status,
    );
  }

  // Do not expose database details or credentials.
  return jsonResponse(
    {
      success: false,
      message:
        "Unable to complete this action. Please try again.",
    },
    500,
  );
}

export function requirePost(
  request: Request,
): void {
  if (request.method !== "POST") {
    throw new HttpError(
      405,
      "Only POST requests are supported.",
    );
  }
}