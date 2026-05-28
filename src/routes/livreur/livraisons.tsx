import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/livreur/livraisons")({ component: Livraisons });

type Delivery = {
  id: string;
  client: string;
  produit: string;
  prix: number;
  frais_livraison: number;
  devise: string;
  mode_paiement: string | null;
  statut: string;
  observation: string | null;
  created_at: string;
  usd_received?: number | null;
  cdf_received?: number | null;
  exchange_rate?: number | null;
  commission_usd?: number | null;
  commission_cdf?: number | null;
};

function Livraisons() {
  const [list, setList] = useState<Delivery[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client: "",
    adresse: "",
    produit: "",
    quantite: "1",
    prix: "",
    usd_received: "",
    cdf_received: "",
    frais_livraison: "0",
    exchange_rate: "2300",
    devise: "USD",
    mode_paiement: "Cash",
    statut: "reussie",
    observation: "",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("deliveries")
      .select("id,client,produit,prix,frais_livraison,devise,mode_paiement,statut,observation,created_at,usd_received,cdf_received,exchange_rate,commission_usd,commission_cdf")
      .eq("livreur_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setList(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const usdReceived = Number(form.usd_received) || 0;
  const cdfReceived = Number(form.cdf_received) || 0;
  const exchangeRate = Number(form.exchange_rate) || 2300;
  const generalTotalUsd = useMemo(
    () => usdReceived + cdfReceived / (exchangeRate || 1),
    [usdReceived, cdfReceived, exchangeRate],
  );
  const commissionUsd = useMemo(() => usdReceived * 0.1, [usdReceived]);
  const commissionCdf = useMemo(() => cdfReceived * 0.1, [cdfReceived]);
  const prixAmount = Number(form.prix) || 0;
  const fraisAmount = Number(form.frais_livraison) || 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    if (!usdReceived && !cdfReceived) {
      toast.error("Veuillez saisir un montant reçu en USD ou en CDF.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("deliveries").insert({
      livreur_id: user.id,
      client: form.client,
      adresse: form.adresse || null,
      produit: form.produit,
      quantite: Number(form.quantite) || 1,
      prix: prixAmount,
      frais_livraison: fraisAmount,
      devise: "USD",
      usd_received: usdReceived,
      cdf_received: cdfReceived,
      exchange_rate: exchangeRate,
      commission_usd: Number(commissionUsd.toFixed(2)),
      commission_cdf: Number(commissionCdf.toFixed(2)),
      mode_paiement: form.mode_paiement,
      statut: form.statut,
      observation: form.observation || null,
    });

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Livraison enregistrée");
    setForm({
      ...form,
      client: "",
      adresse: "",
      produit: "",
      prix: "",
      usd_received: "",
      cdf_received: "",
      frais_livraison: "0",
      observation: "",
    });
    setShowForm(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes livraisons</h1>
          <p className="text-sm text-muted-foreground">Enregistrer un paiement en USD et CDF — chaque devise dans sa colonne.</p>
        </div>
        <Button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-yellow)] px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-[rgba(251,191,36,0.25)] hover:bg-[var(--brand-yellow)]/95"
        >
          <Plus className="size-4" /> Nouvelle livraison
        </Button>
      </div>

      {showForm && (
        <Card className="overflow-hidden">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border-r border-muted/50 p-6 lg:block hidden">
              <div className="space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Paiement multi-devise</p>
                  <h2 className="text-2xl font-bold">Encaisser USD et CDF sans perdre le suivi</h2>
                </div>
                <div className="rounded-3xl bg-slate-950/5 p-4">
                  <p className="text-sm text-muted-foreground">Montant attendu</p>
                  <p className="mt-2 text-3xl font-semibold">${(prixAmount + fraisAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-3xl bg-slate-950/5 p-4">
                  <p className="text-sm text-muted-foreground">Total général USD</p>
                  <p className="mt-2 text-2xl font-semibold">${generalTotalUsd.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <CardHeader>
                <CardTitle>Nouvelle livraison</CardTitle>
              </CardHeader>
              <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
                <Field label="Client" value={form.client} onChange={(v) => setForm({ ...form, client: v })} required />
                <Field label="Adresse" value={form.adresse} onChange={(v) => setForm({ ...form, adresse: v })} />
                <Field label="Produit" value={form.produit} onChange={(v) => setForm({ ...form, produit: v })} required />
                <Field label="Quantité" type="number" value={form.quantite} onChange={(v) => setForm({ ...form, quantite: v })} />
                <Field label="Prix (USD)" type="number" value={form.prix} onChange={(v) => setForm({ ...form, prix: v })} required />
                <Field label="Frais livraison (USD)" type="number" value={form.frais_livraison} onChange={(v) => setForm({ ...form, frais_livraison: v })} />
                <Field label="Reçu en USD" type="number" value={form.usd_received} onChange={(v) => setForm({ ...form, usd_received: v })} />
                <Field label="Reçu en CDF" type="number" value={form.cdf_received} onChange={(v) => setForm({ ...form, cdf_received: v })} />
                <Field label="Taux de change (CDF / 1 USD)" type="number" value={form.exchange_rate} onChange={(v) => setForm({ ...form, exchange_rate: v })} />

                <div className="md:col-span-2">
                  <div className="rounded-3xl border border-muted/50 bg-slate-950/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Total perçu</p>
                        <p className="mt-1 text-xl font-semibold">${usdReceived.toFixed(2)} + {cdfReceived.toLocaleString()} FC</p>
                      </div>
                      <div className="rounded-2xl bg-[var(--brand-yellow)] px-3 py-2 text-sm font-semibold text-black">Commission 10%</div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/90 p-3 shadow-sm">
                        <p className="text-xs text-muted-foreground">Commission USD</p>
                        <p className="mt-1 text-lg font-semibold">${commissionUsd.toFixed(2)}</p>
                      </div>
                      <div className="rounded-2xl bg-white/90 p-3 shadow-sm">
                        <p className="text-xs text-muted-foreground">Commission CDF</p>
                        <p className="mt-1 text-lg font-semibold">{commissionCdf.toLocaleString()} FC</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Prix et frais en USD. Vous pouvez enregistrer un paiement en USD, en CDF, ou un mélange des deux.
                    </p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label>Observation</Label>
                  <Textarea value={form.observation} onChange={(e) => setForm({ ...form, observation: e.target.value })} />
                </div>

                <Button type="submit" disabled={saving} className="md:col-span-2 bg-black text-white hover:bg-black/90">
                  {saving ? "Enregistrement…" : "Enregistrer la livraison"}
                </Button>
              </form>
            </CardContent>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {list.length === 0 && <p className="text-sm text-muted-foreground">Aucune livraison enregistrée</p>}
        {list.map((d) => {
          const generalTotalUsdItem = Number(d.usd_received ?? 0) + Number(d.cdf_received ?? 0) / (Number(d.exchange_rate ?? 2300) || 1);
          return (
            <Card key={d.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-base font-semibold">{d.client}</div>
                    <div className="text-sm text-muted-foreground">{d.produit}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {d.devise === "CDF" ? `${(Number(d.prix) + Number(d.frais_livraison)).toLocaleString()} FC` : `$${(Number(d.prix) + Number(d.frais_livraison)).toFixed(2)}`}
                    </div>
                    <div className="text-xs text-muted-foreground">{d.statut}</div>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-950/5 p-3">
                    <div className="text-xs text-muted-foreground">Reçu USD</div>
                    <div className="font-semibold">${Number(d.usd_received ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-950/5 p-3">
                    <div className="text-xs text-muted-foreground">Reçu CDF</div>
                    <div className="font-semibold">{Number(d.cdf_received ?? 0).toLocaleString()} FC</div>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/90 p-3 shadow-sm">
                    <div className="text-xs text-muted-foreground">Commission USD</div>
                    <div className="font-semibold">${Number(d.commission_usd ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="rounded-2xl bg-white/90 p-3 shadow-sm">
                    <div className="text-xs text-muted-foreground">Commission CDF</div>
                    <div className="font-semibold">{Number(d.commission_cdf ?? 0).toLocaleString()} FC</div>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
                  <div>Mode de paiement: {d.mode_paiement}</div>
                  <div>Taux: {Number(d.exchange_rate ?? 0).toLocaleString()} CDF / USD</div>
                </div>
                <div className="text-sm text-muted-foreground">Total général USD: ${generalTotalUsdItem.toFixed(2)}</div>
                {d.observation && <div className="rounded-2xl bg-slate-950/5 p-3 text-sm text-muted-foreground">Observation: {d.observation}</div>}
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>{new Date(d.created_at).toLocaleString("fr")}</span>
                  <span className={d.statut === "annulee" ? "text-destructive" : "text-foreground"}>{d.statut}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
