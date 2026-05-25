import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signUpWithBadge } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({ component: Register });

function Register() {
  const [badge, setBadge] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Mot de passe : minimum 6 caractères");
      return;
    }
    setLoading(true);
    const { error } = await signUpWithBadge(badge, password, fullName, phone);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Compte créé");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-black p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-2 mb-6">
          <Logo className="h-14" />
          <h1 className="text-lg font-bold">Créer un compte</h1>
          <p className="text-xs text-muted-foreground">Le premier compte créé devient administrateur</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Numéro de badge</Label>
            <Input placeholder="B-N01-JM" value={badge} onChange={(e) => setBadge(e.target.value)} required />
          </div>
          <div>
            <Label>Nom complet</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Mot de passe</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--brand-yellow)] text-black hover:bg-[var(--brand-yellow)]/90 font-semibold"
          >
            {loading ? "Création…" : "Créer"}
          </Button>
          <Link to="/login" className="block text-center text-xs text-muted-foreground hover:underline">
            Retour à la connexion
          </Link>
        </form>
      </div>
    </div>
  );
}
