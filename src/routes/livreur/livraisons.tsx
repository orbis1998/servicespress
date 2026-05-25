import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/livreur/livraisons")({ component: Livraisons });

type Delivery = {
  id: string; client: string; produit: string; prix: number; frais_livraison: number;
  devise: string; statut: string; created_at: string;
};

function Livraisons() {
  const [list, setList] = useState<Delivery[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client: "", adresse: "", produit: "", quantite: "1", prix: "", frais_livraison: "0",
    devise: "USD", mode_paiement: "Cash", statut: "reussie", observation: "",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("deliveries")
      .select("id,client,produit,prix,frais_livraison,devise,statut,created_at")
      .eq("livreur_id", user.id).order("created_at", { ascending: false }).limit(50);
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("deliveries").insert({
      livreur_id: user.id,
      client: form.client,
      adresse: form.adresse || null,
      produit: form.produit,
      quantite: Number(form.quantite) || 1,
      prix: Number(form.prix) || 0,
      frais_livraison: Number(form.frais_livraison) || 0,
      devise: form.devise,
      mode_paiement: form.mode_paiement,
      statut: form.statut,
      observation: form.observation || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Livraison enregistrée");
    setForm({ ...form, client: "", adresse: "", produit: "", prix: "", frais_livraison: "0", observation: "" });
    setShowForm(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes livraisons</h1>
        <Button onClick={() => setShowForm((s) => !s)} className="bg-[var(--brand-yellow)] text-black hover:bg-[var(--brand-yellow)]/90 font-semibold">
          <Plus className="size-4" /> Nouvelle
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nouvelle livraison</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
              <Field label="Client" value={form.client} onChange={(v) => setForm({ ...form, client: v })} required />
              <Field label="Adresse" value={form.adresse} onChange={(v) => setForm({ ...form, adresse: v })} />
              <Field label="Produit" value={form.produit} onChange={(v) => setForm({ ...form, produit: v })} required />
              <Field label="Quantité" type="number" value={form.quantite} onChange={(v) => setForm({ ...form, quantite: v })} />
              <Field label="Prix" type="number" value={form.prix} onChange={(v) => setForm({ ...form, prix: v })} required />
              <Field label="Frais livraison" type="number" value={form.frais_livraison} onChange={(v) => setForm({ ...form, frais_livraison: v })} />
              <div>
                <Label>Devise</Label>
                <Select value={form.devise} onValueChange={(v) => setForm({ ...form, devise: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="CDF">CDF (FC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mode paiement</Label>
                <Select value={form.mode_paiement} onValueChange={(v) => setForm({ ...form, mode_paiement: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                    <SelectItem value="Carte">Carte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Statut</Label>
                <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reussie">Réussie</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="annulee">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Observation</Label>
                <Textarea value={form.observation} onChange={(e) => setForm({ ...form, observation: e.target.value })} />
              </div>
              <Button type="submit" disabled={saving} className="md:col-span-2 bg-black text-white hover:bg-black/90">
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {list.length === 0 && <p className="text-sm text-muted-foreground">Aucune livraison enregistrée</p>}
        {list.map((d) => (
          <Card key={d.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{d.client} · {d.produit}</div>
                <div className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString("fr")}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">{(Number(d.prix) + Number(d.frais_livraison)).toLocaleString()} {d.devise}</div>
                <div className={`text-xs ${d.statut === "annulee" ? "text-destructive" : "text-muted-foreground"}`}>{d.statut}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}
