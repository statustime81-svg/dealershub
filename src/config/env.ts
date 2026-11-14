function readValue(value: string | undefined): string {
  return value?.trim() ?? "";
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );
  } catch {
    return false;
  }
}

const supabaseUrl = readValue(
  import.meta.env.VITE_SUPABASE_URL,
);

const supabaseAnonKey = readValue(
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

const configurationErrors: string[] = [];

if (!supabaseUrl) {
  configurationErrors.push(
    "VITE_SUPABASE_URL is missing.",
  );
} else if (!isHttpUrl(supabaseUrl)) {
  configurationErrors.push(
    "VITE_SUPABASE_URL must be a valid HTTP or HTTPS URL.",
  );
} else if (supabaseUrl.includes("YOUR_PROJECT_REF")) {
  configurationErrors.push(
    "Replace YOUR_PROJECT_REF with your Supabase project reference.",
  );
}

if (!supabaseAnonKey) {
  configurationErrors.push(
    "VITE_SUPABASE_ANON_KEY is missing.",
  );
} else if (supabaseAnonKey.startsWith("YOUR_")) {
  configurationErrors.push(
    "Replace the Supabase key placeholder with your publishable or anon key.",
  );
} else if (supabaseAnonKey.startsWith("sb_secret_")) {
  configurationErrors.push(
    "A secret key cannot be used in the frontend.",
  );
}

export const env = Object.freeze({
  supabaseUrl,
  supabaseAnonKey,

  isDevelopment: import.meta.env.DEV,

  isProduction: import.meta.env.PROD,

  isSupabaseConfigured:
    configurationErrors.length === 0,

  configurationErrors: Object.freeze(
    configurationErrors,
  ),
});

export function requireSupabaseConfiguration(): void {
  if (!env.isSupabaseConfigured) {
    throw new Error(
      [
        "Supabase is not configured.",
        ...env.configurationErrors,
        "Update .env.local and restart the development server.",
      ].join(" "),
    );
  }
}