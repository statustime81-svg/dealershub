export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const code =
    "code" in error && typeof error.code === "string"
      ? error.code
      : "";

  switch (code) {
    case "invalid_credentials":
      return "Email or password is incorrect.";

    case "email_not_confirmed":
      return "Verify your email address before signing in.";

    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Please wait before trying again.";

    case "weak_password":
      return "Choose a stronger password that meets the account requirements.";

    case "same_password":
      return "Choose a password different from your current password.";

    case "session_not_found":
    case "refresh_token_not_found":
    case "refresh_token_already_used":
      return "Your session has expired. Please sign in again.";

    case "otp_expired":
      return "This link has expired. Request a new link.";

    case "user_banned":
      return "This account is unavailable. Contact your administrator.";

    default:
      return fallback;
  }
}