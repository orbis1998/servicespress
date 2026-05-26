/** Projet Supabase actif — doit correspondre à .env */
export const SUPABASE_PROJECT_ID = "hojhdavvqmejfkydousk";

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;

export function getSupabaseEnvError(): string | null {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return "Variables VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY manquantes. Redémarrez npm run dev.";
  }
  if (!SUPABASE_URL.includes(SUPABASE_PROJECT_ID)) {
    return `Mauvais projet Supabase (${SUPABASE_URL}). Arrêtez le serveur, lancez npm run dev:clean, puis réessayez.`;
  }
  if (SUPABASE_URL.includes("yzmajzccolxdbjeraooq")) {
    return "Encore l'ancien projet Supabase en cache. Lancez npm run dev:clean.";
  }
  return null;
}
