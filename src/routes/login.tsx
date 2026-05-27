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
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <div className="mx-auto w-full max-w-3xl gap-8 lg:grid lg:grid-cols-[1.2fr_0.9fr]">
        <section className="hidden rounded-[1.5rem] border border-white/10 bg-black/70 p-8 lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <span className="inline-flex rounded-full bg-[var(--brand-yellow)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brand-yellow)]">
              Nouveau design
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-white">Accédez à votre espace de gestion plus vite.</h1>
              <p className="text-base leading-7 text-slate-300">
                ServicExpress devient plus clair, plus fluide et plus professionnel. Suivez vos livreurs, vos livraisons et vos paiements depuis un tableau de bord pensé pour l’action.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-400">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">Connexion sécurisée</p>
              <p className="mt-1">Badge + mot de passe, accès rapide et contrôlé.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">Dashboard clair</p>
              <p className="mt-1">Navigation fluide entre admin, livreurs, stock et paie.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">Vue professionnelle</p>
              <p className="mt-1">Statistiques visuelles, cartes et listes améliorées.</p>
            </div>
          </div>
        </section>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-[1.25rem] border border-white/10 bg-black/95 p-6 shadow-lg"
        >
          <div className="flex flex-col gap-4 rounded-3xl bg-slate-950/80 p-6 shadow-inner shadow-slate-950/20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                  <Logo className="h-14 rounded-3xl bg-white/10 p-2" />
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-[var(--brand-yellow)]">ServicExpress</p>
                    <p className="text-xl font-semibold text-white">Connexion</p>
                  </div>
                </div>
            </div>

            <p className="max-w-xl text-sm leading-6 text-slate-400">
              Identifiez-vous avec votre badge pour accéder immédiatement à votre espace admin ou livreur.
            </p>
          </div>

          {envError && (
            <div className="my-6 rounded-3xl border border-red-300/30 bg-red-50/80 px-4 py-3 text-sm text-red-800">
              {envError}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="badge">Numéro de badge</Label>
              <Input
                id="badge"
                autoComplete="username"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                required
                className="bg-black text-white ring-white/10 placeholder:text-slate-500"
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
                  className="pr-10 bg-black text-white ring-white/10 placeholder:text-slate-500"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Cacher le mot de passe" : "Voir le mot de passe"}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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

          <div className="mt-8 rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-400">
            <p>Besoin d’aide ? Vérifiez votre badge auprès de l’administrateur ou contactez le support interne.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
