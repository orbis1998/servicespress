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
import { Eye, EyeOff } from "lucide-react";
import { SUPABASE_PROJECT_ID, SUPABASE_URL, getSupabaseEnvError } from "@/integrations/supabase/env";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [badge, setBadge] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-white text-[var(--brand-black)] px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo className="h-36" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-[1.25rem] border border-white/10 bg-white p-6 shadow-sm"
        >
          {envError && (
            <div className="mb-4 rounded-md border border-red-300/30 bg-red-50/80 px-4 py-3 text-sm text-red-800">
              {envError}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="badge">Numéro de badge</Label>
              <Input
                id="badge"
                autoComplete="username"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                required
                className="bg-white text-[var(--brand-black)] ring-white/10 placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10 bg-white text-[var(--brand-black)] ring-white/10 placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Cacher le mot de passe" : "Voir le mot de passe"}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[var(--brand-black)]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[var(--brand-yellow)] px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:brightness-95"
            >
              {submitting ? "Connexion…" : "Se connecter"}
            </Button>
          </form>

          <div className="mt-6 text-sm text-muted-foreground text-center">
            Besoin d’aide ? Vérifiez votre badge auprès de l’administrateur.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
