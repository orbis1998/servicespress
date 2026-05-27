/** Projet Supabase actif — doit correspondre à .env */
export const SUPABASE_PROJECT_ID =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "hojhdavvqmejfkydousk";

export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export function getSupabaseEnvError(): string | null {
  if (!SUPABASE_PUBLISHABLE_KEY) {
    return "Variable VITE_SUPABASE_PUBLISHABLE_KEY manquante. Vérifiez les variables Vercel.";
  }
  if (!SUPABASE_URL) {
    return "Variable VITE_SUPABASE_URL manquante. Vérifiez les variables Vercel.";
  }
  if (!SUPABASE_URL.includes(SUPABASE_PROJECT_ID)) {
    return `Mauvais projet Supabase (${SUPABASE_URL}). Vérifiez VITE_SUPABASE_PROJECT_ID et VITE_SUPABASE_URL.`;
  }
  if (SUPABASE_URL.includes("yzmajzccolxdbjeraooq")) {
    return "Encore l'ancien projet Supabase en cache. Lancez npm run dev:clean.";
  }
  return null;
}
