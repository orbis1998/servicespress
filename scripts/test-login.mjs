import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnv() {
  const text = readFileSync(".env", "utf8").replace(/\r/g, "");
  const env = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    let val = trimmed.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[trimmed.slice(0, i).trim()] = val;
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

const email = "adm-001@servicexpress.local";
const password = "Admin2026!";

const { data, error } = await supabase.auth.signInWithPassword({ email, password });

console.log("URL:", env.SUPABASE_URL);
console.log("signIn:", error?.message ?? "OK", "session:", !!data?.session);

if (data?.session) {
  const roles = await supabase.from("user_roles").select("role").eq("user_id", data.session.user.id);
  console.log("roles:", roles.error?.message ?? "OK", roles.data);
}
