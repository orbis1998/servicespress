import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import {
  SUPABASE_PROJECT_ID,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  getSupabaseEnvError,
} from "./env";

const envError = getSupabaseEnvError();
if (envError && import.meta.env.DEV) {
  console.error(`[ServiceXpress] ${envError}`);
}

const isBrowser = typeof window !== "undefined";

export const supabase = createClient<Database>(
  SUPABASE_URL ?? `https://${SUPABASE_PROJECT_ID}.supabase.co`,
  SUPABASE_PUBLISHABLE_KEY ?? "missing-anon-key",
  {
    auth: {
      storage: isBrowser ? window.localStorage : undefined,
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
    },
  },
);
