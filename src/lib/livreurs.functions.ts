import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const badgeToEmail = (badge: string) =>
  `${badge.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")}@servicexpress.local`;

export const createLivreur = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      badge: z.string().min(2).max(40),
      fullName: z.string().min(2).max(120),
      phone: z.string().max(40).optional().nullable(),
      password: z.string().min(6).max(64),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // verify caller is admin
    const { data: roleRow } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).maybeSingle();
    if (roleRow?.role !== "admin") throw new Error("Accès refusé");

    const email = badgeToEmail(data.badge);
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email, password: data.password, email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message ?? "Création échouée");

    await supabaseAdmin.from("profiles").upsert({
      id: created.user.id,
      badge_number: data.badge.trim().toUpperCase(),
      full_name: data.fullName,
      phone: data.phone ?? null,
    });
    await supabaseAdmin.from("user_roles").upsert({
      user_id: created.user.id, role: "livreur",
    });
    return { ok: true, id: created.user.id };
  });

export const deleteLivreur = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: roleRow } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).maybeSingle();
    if (roleRow?.role !== "admin") throw new Error("Accès refusé");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetLivreurPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), password: z.string().min(6).max(64) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: roleRow } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).maybeSingle();
    if (roleRow?.role !== "admin") throw new Error("Accès refusé");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
