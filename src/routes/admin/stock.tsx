import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/stock")({ component: AdminStock });

type StockItem = { id: string; produit: string; taille: string | null; couleur: string | null; quantite: number; commentaire: string | null; livreur_id: string | null };
type P = { id: string; full_name: string; badge_number: string };

function AdminStock() {
  const [list, setList] = useState<StockItem[]>([]);
  const [livreurs, setLivreurs] = useState<P[]>([]);
  const [form, setForm] = useState({ livreur_id: "", produit: "", taille: "", couleur: "", quantite: "1", commentaire: "" });

  const load = async () => {
    const [{ data: s }, { data: prof }, { data: admins }] = await Promise.all([
      supabase.from("stock").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,full_name,badge_number").order("full_name"),
      supabase.from("user_roles").select("user_id").eq("role", "admin"),
    ]);
    const adminIds = (admins ?? []).map((a) => a.user_id);
    setList((s as StockItem[] | null) ?? []);
    setLivreurs(((prof as P[] | null) ?? []).filter((p) => !adminIds.includes(p.id)));
  };
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.livreur_id) return toast.error("Sélectionnez un livreur");
    const { error } = await supabase.from("stock").insert({
      livreur_id: form.livreur_id, produit: form.produit,
      taille: form.taille || null, couleur: form.couleur || null,
      quantite: Number(form.quantite) || 0, commentaire: form.commentaire || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Stock attribué");
    setForm({ ...form, produit: "", taille: "", couleur: "", quantite: "1", commentaire: "" });
    load();
  };

  const del = async (id: string) => {
    await supabase.from("stock").delete().eq("id", id);
    load();
  };

  const livreurName = (id: string | null) =>
    livreurs.find((l) => l.id === id)?.full_name ?? "Général";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Gestion du stock</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Attribuer un produit à un livreur</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-3">
              <Label>Livreur</Label>
              <Select value={form.livreur_id} onValueChange={(v) => setForm({ ...form, livreur_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir un livreur" /></SelectTrigger>
                <SelectContent>
                  {livreurs.map((l) => <SelectItem key={l.id} value={l.id}>{l.full_name} ({l.badge_number})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Produit</Label><Input value={form.produit} onChange={(e) => setForm({ ...form, produit: e.target.value })} required /></div>
            <div><Label>Taille</Label><Input value={form.taille} onChange={(e) => setForm({ ...form, taille: e.target.value })} /></div>
            <div><Label>Couleur</Label><Input value={form.couleur} onChange={(e) => setForm({ ...form, couleur: e.target.value })} /></div>
            <div><Label>Quantité</Label><Input type="number" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Commentaire</Label><Input value={form.commentaire} onChange={(e) => setForm({ ...form, commentaire: e.target.value })} /></div>
            <div className="md:col-span-3"><Button type="submit" className="bg-[var(--brand-yellow)] text-black hover:bg-[var(--brand-yellow)]/90 font-semibold"><Plus className="size-4" /> Attribuer</Button></div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-2 md:grid-cols-2">
        {list.length === 0 && <p className="text-sm text-muted-foreground">Aucun stock</p>}
        {list.map((s) => (
          <Card key={s.id}>
            <CardContent className="pt-4 flex justify-between items-center">
              <div>
                <div className="font-semibold">{s.produit}</div>
                <div className="text-xs text-muted-foreground">
                  {[s.taille, s.couleur].filter(Boolean).join(" · ") || "—"} · <span className="font-medium text-foreground">{livreurName(s.livreur_id)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-[var(--brand-yellow)] bg-black px-3 py-1 rounded">{s.quantite}</div>
                <Button variant="ghost" size="icon" onClick={() => del(s.id)}><Trash2 className="size-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
