/**
 * Crée ou réinitialise le compte administrateur.
 * Usage: node scripts/create-admin.mjs [badge] [motdepasse] [nom]
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const path = resolve(process.cwd(), ".env");
  const text = readFileSync(path, "utf8").replace(/\r/g, "");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    let val = trimmed.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

function badgeToEmail(badge) {
  return `${badge.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")}@servicexpress.local`;
}

loadEnv();

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const badge = process.argv[2] ?? "ADM-001";
const password = process.argv[3] ?? "Admin2026!";
const fullName = process.argv[4] ?? "Administrateur";

if (!url || !serviceKey) {
  console.error("Manque SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY dans .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = badgeToEmail(badge);

async function findUserByEmail(targetEmail) {
  let page = 1;
  const perPage = 200;
  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (hit) return hit;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

let userId;

const existing = await findUserByEmail(email);

if (existing) {
  const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("Erreur mise à jour auth:", error.message);
    process.exit(1);
  }
  userId = data.user.id;
  console.log("Compte existant — mot de passe réinitialisé.");
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    console.error("Erreur création auth:", error?.message ?? "inconnue");
    process.exit(1);
  }
  userId = data.user.id;
  console.log("Nouveau compte admin créé.");
}

const { error: profileErr } = await supabase.from("profiles").upsert(
  {
    id: userId,
    badge_number: badge.trim().toUpperCase(),
    full_name: fullName,
    phone: null,
  },
  { onConflict: "id" },
);

if (profileErr) {
  console.error("Erreur profil:", profileErr.message);
  process.exit(1);
}

const { error: roleErr } = await supabase.from("user_roles").upsert(
  { user_id: userId, role: "admin" },
  { onConflict: "user_id,role" },
);

if (roleErr) {
  console.error("Erreur rôle:", roleErr.message);
  process.exit(1);
}

console.log("");
console.log("Connexion sur http://localhost:8080/login");
console.log("  Badge        :", badge.trim().toUpperCase());
console.log("  Email auth   :", email);
console.log("  Mot de passe :", password);
console.log("");
console.log("Copiez le badge exactement (ex: ADM-001, sans espaces en trop).");
