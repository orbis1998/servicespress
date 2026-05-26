import { supabase } from "@/integrations/supabase/client";

// Badge -> synthetic email so we can use email/password Supabase auth
export const badgeToEmail = (badge: string) =>
  `${badge.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")}@servicexpress.local`;

export async function signInWithBadge(badge: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: badgeToEmail(badge),
    password,
  });
}

export async function signUpWithBadge(
  badge: string,
  password: string,
  fullName: string,
  phone?: string,
) {
  const email = badgeToEmail(badge);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error || !data.user) return { data, error };
  // Insert profile
  const { error: pErr } = await supabase.from("profiles").insert({
    id: data.user.id,
    badge_number: badge.trim().toUpperCase(),
    full_name: fullName,
    phone: phone ?? null,
  });
  return { data, error: pErr };
}

export async function getCurrentRole(userId: string): Promise<"admin" | "livreur" | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    console.error("[auth] getCurrentRole:", error.message);
    return null;
  }

  const roles = (data ?? []).map((row) => row.role);
  if (roles.includes("admin")) return "admin";
  if (roles.includes("livreur")) return "livreur";
  return null;
}

export function homePathForRole(role: "admin" | "livreur" | null): "/admin" | "/livreur" | "/login" {
  if (role === "admin") return "/admin";
  if (role === "livreur") return "/livreur";
  return "/login";
}
