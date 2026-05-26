import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { signInWithBadge } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [badge, setBadge] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/" });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signInWithBadge(badge, password);
    setLoading(false);
    if (error) {
      toast.error("Identifiants incorrects");
      return;
    }
    toast.success("Connecté");
    navigate({ to: "/" });
  };

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
            disabled={loading}
            className="w-full bg-[var(--brand-yellow)] text-black hover:bg-[var(--brand-yellow)]/90 font-semibold"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
