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
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showPassword ? "Cacher le mot de passe" : "Voir le mot de passe"}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
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
