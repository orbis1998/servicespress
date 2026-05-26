import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createLivreur, deleteLivreur, resetLivreurPassword } from "@/lib/livreurs.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, KeyRound } from "lucide-react";

export const Route = createFileRoute("/admin/livreurs")({ component: AdminLivreurs });

type P = { id: string; badge_number: string; full_name: string; phone: string | null; adresse: string | null; status: string; photo_url: string | null };

function AdminLivreurs() {
  const [list, setList] = useState<P[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ badge: "", fullName: "", phone: "", password: "" });
  const [saving, setSaving] = useState(false);
  const createFn = useServerFn(createLivreur);
  const deleteFn = useServerFn(deleteLivreur);
  const resetFn = useServerFn(resetLivreurPassword);

  const load = async () => {
    // exclude admin (role admin)
    const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    const adminIds = (admins ?? []).map((a) => a.user_id);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setList(((data as P[] | null) ?? []).filter((p) => !adminIds.includes(p.id)));
  };
  useEffect(() => { load(); }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createFn({ data: form });
      toast.success("Livreur créé");
      setForm({ badge: "", fullName: "", phone: "", password: "" });
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Erreur");
    } finally { setSaving(false); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Supprimer ce livreur ?")) return;
    try { await deleteFn({ data: { id } }); toast.success("Supprimé"); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  const onReset = async (id: string) => {
    const pwd = prompt("Nouveau mot de passe (min 6 caractères) :");
    if (!pwd || pwd.length < 6) return;
    try { await resetFn({ data: { id, password: pwd } }); toast.success("Mot de passe réinitialisé"); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Livreurs</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[var(--brand-yellow)] text-black hover:bg-[var(--brand-yellow)]/90 font-semibold">
              <Plus className="size-4" /> Nouveau livreur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer un livreur</DialogTitle></DialogHeader>
            <form onSubmit={onCreate} className="space-y-3">
              <div><Label>Badge</Label><Input placeholder="B-N02-JM" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} required /></div>
              <div><Label>Nom complet</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></div>
              <div><Label>Téléphone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Mot de passe initial</Label><Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} /></div>
              <Button type="submit" disabled={saving} className="w-full bg-black text-white">{saving ? "Création…" : "Créer"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {list.length === 0 && <p className="text-sm text-muted-foreground">Aucun livreur — créez le premier</p>}
        {list.map((p) => (
          <Card key={p.id}>
            <CardContent className="pt-4 flex justify-between items-center gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-12 rounded-full bg-accent overflow-hidden grid place-items-center font-bold shrink-0">
                  {p.photo_url ? <img src={p.photo_url} alt={p.full_name} className="size-full object-cover" /> : p.full_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{p.full_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.phone ?? "—"} · {p.adresse ?? "—"}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="font-mono font-bold text-[var(--brand-yellow)] bg-black px-2 py-1 rounded text-xs">{p.badge_number}</div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => onReset(p.id)} title="Réinitialiser MDP"><KeyRound className="size-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(p.id)} title="Supprimer"><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
