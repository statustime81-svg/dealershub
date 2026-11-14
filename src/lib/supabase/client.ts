import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import {
  env,
  requireSupabaseConfiguration,
} from "@/config/env";

let browserClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  requireSupabaseConfiguration();

  if (!browserClient) {
    browserClient = createClient(
      env.supabaseUrl,
      env.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
        },
      },
    );
  }

  return browserClient;
}

export function isSupabaseConfigured(): boolean {
  return env.isSupabaseConfigured;
}