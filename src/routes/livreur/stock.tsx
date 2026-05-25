import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/livreur/stock")({ component: Stock });

type StockItem = { id: string; produit: string; taille: string | null; couleur: string | null; quantite: number; commentaire: string | null };

function Stock() {
  const [list, setList] = useState<StockItem[]>([]);
  const [form, setForm] = useState({ produit: "", taille: "", couleur: "", quantite: "0", commentaire: "" });

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("stock").select("*").eq("livreur_id", user.id).order("created_at", { ascending: false });
    setList((data as StockItem[] | null) ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("stock").insert({
      livreur_id: user.id,
      produit: form.produit,
      taille: form.taille || null,
      couleur: form.couleur || null,
      quantite: Number(form.quantite) || 0,
      commentaire: form.commentaire || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Ajouté");
    setForm({ produit: "", taille: "", couleur: "", quantite: "0", commentaire: "" });
    load();
  };

  const del = async (id: string) => {
    await supabase.from("stock").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Mon stock</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Ajouter un produit</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-3 md:grid-cols-5">
            <div><Label>Produit</Label><Input value={form.produit} onChange={(e) => setForm({ ...form, produit: e.target.value })} required /></div>
            <div><Label>Taille</Label><Input value={form.taille} onChange={(e) => setForm({ ...form, taille: e.target.value })} placeholder="XL" /></div>
            <div><Label>Couleur</Label><Input value={form.couleur} onChange={(e) => setForm({ ...form, couleur: e.target.value })} placeholder="Blanc" /></div>
            <div><Label>Quantité</Label><Input type="number" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} /></div>
            <div className="flex items-end"><Button type="submit" className="w-full bg-[var(--brand-yellow)] text-black hover:bg-[var(--brand-yellow)]/90"><Plus className="size-4" />Ajouter</Button></div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-2 md:grid-cols-2">
        {list.length === 0 && <p className="text-sm text-muted-foreground">Aucun produit en stock</p>}
        {list.map((s) => (
          <Card key={s.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{s.produit}</div>
                <div className="text-xs text-muted-foreground">
                  {[s.taille, s.couleur].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold">{s.quantite}</div>
                <Button variant="ghost" size="icon" onClick={() => del(s.id)}><Trash2 className="size-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
