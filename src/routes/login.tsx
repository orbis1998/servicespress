import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getCurrentRole, homePathForRole, signInWithBadge } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { SUPABASE_PROJECT_ID, SUPABASE_URL, getSupabaseEnvError } from "@/integrations/supabase/env";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [badge, setBadge] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { loading: authLoading, session, role, refresh } = useAuth();
  const envError = getSupabaseEnvError();

  useEffect(() => {
    if (authLoading) return;
    if (session && role) navigate({ to: homePathForRole(role), replace: true });
  }, [authLoading, session, role, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await signInWithBadge(badge, password);
      if (error || !data.session) {
        toast.error(error?.message ?? "Identifiants incorrects");
        return;
      }

      await refresh();

      const nextRole = await getCurrentRole(data.session.user.id);
      if (!nextRole) {
        toast.error(
          "Connexion OK mais aucun rôle trouvé. Vérifiez user_roles dans Supabase.",
        );
        return;
      }

      toast.success("Connecté");
      navigate({ to: homePathForRole(nextRole), replace: true });
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-black text-white">
        Chargement…
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center gap-2 mb-6">
          <Logo className="h-20" />
        </div>

        {envError && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {envError}
          </div>
        )}

        {import.meta.env.DEV && (
          <p className="mb-4 text-center text-xs text-muted-foreground break-all">
            Projet : {SUPABASE_PROJECT_ID}
            <br />
            {SUPABASE_URL ?? "(URL non chargée)"}
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="badge">Numéro de badge</Label>
            <Input
              id="badge"
              autoComplete="username"
              placeholder="ADM-001"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-[var(--brand-yellow)] text-black hover:bg-[var(--brand-yellow)]/90 font-semibold"
          >
            {submitting ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
